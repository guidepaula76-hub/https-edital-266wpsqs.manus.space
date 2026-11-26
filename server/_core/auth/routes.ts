import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parse as parseCookie } from "cookie";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { getSessionCookieOptions } from "../cookies";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";
import { authStore, DuplicateEmailError, type AuthStore, type StoredSession } from "./store";

const SESSION_COOKIE = "ultra_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_RENEW_BEFORE_MS = 7 * 24 * 60 * 60 * 1000;

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(60, "O nome deve ter até 60 caracteres."),
  email: z.string().trim().email("Informe um e-mail válido.").max(254, "O e-mail deve ter até 254 caracteres."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128, "A senha deve ter até 128 caracteres."),
}).strict();
const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "Informe sua senha.").max(128),
}).strict();
const profileSchema = z.object({ name: z.string().trim().min(2).max(60) }).strict();

type SessionMaterial = { rawToken: string; tokenHash: string; csrfToken: string; expiresAt: Date };

function createSessionMaterial(): SessionMaterial {
  const rawToken = randomBytes(32).toString("base64url");
  return {
    rawToken,
    tokenHash: createHash("sha256").update(rawToken).digest("hex"),
    csrfToken: randomBytes(32).toString("base64url"),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  };
}

function sessionCookie(req: Request, res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: SESSION_TTL_MS });
}
function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(SESSION_COOKIE, getSessionCookieOptions(req));
}
function publicUser(user: StoredSession["user"]) {
  return { id: user.id, name: user.name, email: user.email, method: user.method };
}
function noStore(res: Response) {
  res.setHeader("Cache-Control", "no-store");
}
export function requestIsSameOrigin(req: Request): boolean {
  const fetchSite = req.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
  return req.get("X-Ultra-Request") === "1" && Boolean(req.is("application/json"));
}
export function sendError(res: Response, status: number, error: string, code: string) {
  return res.status(status).json({ error, code });
}
export function csrfMatches(expected: string, received: string | undefined): boolean {
  if (!received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readSession(req: Request, store: AuthStore): Promise<{ token: string; tokenHash: string; session: StoredSession } | null> {
  const token = parseCookie(req.headers.cookie ?? "")[SESSION_COOKIE];
  if (!token || token.length > 128) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await store.findSession(tokenHash);
  return session ? { token, tokenHash, session } : null;
}

export function createAuthRouter(store: AuthStore = authStore) {
  const router = Router();
  const authAttempts = new Map<string, { count: number; resetAt: number }>();
  let activePasswordChecks = 0;
  const attemptWindowMs = 15 * 60 * 1000;
  const maxConcurrentPasswordChecks = 4;
  const allowAttempt = (req: Request, action: "signup" | "login", limit: number) => {
    const key = `${action}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const now = Date.now();
    let bucket = authAttempts.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (authAttempts.size >= 5_000) {
        for (const [entryKey, entry] of authAttempts) if (entry.resetAt <= now) authAttempts.delete(entryKey);
        if (authAttempts.size >= 5_000) return false;
      }
      bucket = { count: 0, resetAt: now + attemptWindowMs };
      authAttempts.set(key, bucket);
    }
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  };
  router.use((_req, res, next) => { noStore(res); next(); });

  router.get("/me", async (req, res) => {
    try {
      const current = await readSession(req, store);
      if (!current) {
        if (parseCookie(req.headers.cookie ?? "")[SESSION_COOKIE]) clearSessionCookie(req, res);
        res.json({ user: null, csrfToken: null, googleEnabled: false });
        return;
      }
      if (current.session.expiresAt.getTime() - Date.now() < SESSION_RENEW_BEFORE_MS) {
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await store.extendSession(current.tokenHash, expiresAt);
        sessionCookie(req, res, current.token);
      }
      res.json({ user: publicUser(current.session.user), csrfToken: current.session.csrfToken, googleEnabled: false });
    } catch {
      sendError(res, 503, "Não foi possível verificar sua sessão agora. Tente novamente.", "AUTH_UNAVAILABLE");
    }
  });

  router.post("/signup", async (req, res) => {
    if (!requestIsSameOrigin(req)) return sendError(res, 403, "Não foi possível validar esta solicitação.", "REQUEST_REJECTED");
    if (!allowAttempt(req, "signup", 5)) return sendError(res, 429, "Muitas tentativas de cadastro. Aguarde e tente novamente.", "RATE_LIMITED");
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Confira os dados informados.";
      return sendError(res, 400, message, "INVALID_INPUT");
    }
    const email = normalizeEmail(parsed.data.email);
    if (activePasswordChecks >= maxConcurrentPasswordChecks) return sendError(res, 429, "O serviço está ocupado. Aguarde um instante e tente novamente.", "AUTH_BUSY");
    activePasswordChecks += 1;
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(parsed.data.password);
    } catch {
      return sendError(res, 503, "Não foi possível processar sua senha agora. Tente novamente.", "AUTH_UNAVAILABLE");
    } finally {
      activePasswordChecks -= 1;
    }
    try {
      const material = createSessionMaterial();
      const user = await store.createAccount({
        name: parsed.data.name,
        email,
        passwordHash,
        tokenHash: material.tokenHash,
        csrfToken: material.csrfToken,
        expiresAt: material.expiresAt,
      });
      sessionCookie(req, res, material.rawToken);
      res.status(201).json({ user: publicUser(user), csrfToken: material.csrfToken, googleEnabled: false });
    } catch (error) {
      if (error instanceof DuplicateEmailError) return sendError(res, 409, "Este e-mail já está cadastrado. Tente entrar.", "EMAIL_IN_USE");
      console.error("[Auth] Account creation failed", error instanceof Error ? error.name : "unknown error");
      sendError(res, 503, "Não foi possível criar sua conta agora. Tente novamente mais tarde.", "AUTH_UNAVAILABLE");
    }
  });

  router.post("/login", async (req, res) => {
    if (!requestIsSameOrigin(req)) return sendError(res, 403, "Não foi possível validar esta solicitação.", "REQUEST_REJECTED");
    if (!allowAttempt(req, "login", 10)) return sendError(res, 429, "Muitas tentativas de entrada. Aguarde e tente novamente.", "RATE_LIMITED");
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, parsed.error.issues[0]?.message ?? "Confira os dados informados.", "INVALID_INPUT");
    if (activePasswordChecks >= maxConcurrentPasswordChecks) return sendError(res, 429, "O serviço está ocupado. Aguarde um instante e tente novamente.", "AUTH_BUSY");
    activePasswordChecks += 1;
    try {
      const credential = await store.findCredential(normalizeEmail(parsed.data.email));
      const valid = await verifyPassword(parsed.data.password, credential?.passwordHash);
      if (!credential || !valid) return sendError(res, 401, "E-mail ou senha incorretos.", "INVALID_CREDENTIALS");
      const material = createSessionMaterial();
      await store.createSession(credential.user.id, {
        tokenHash: material.tokenHash,
        csrfToken: material.csrfToken,
        expiresAt: material.expiresAt,
      });
      sessionCookie(req, res, material.rawToken);
      res.json({ user: publicUser(credential.user), csrfToken: material.csrfToken, googleEnabled: false });
    } catch (error) {
      console.error("[Auth] Login failed", error instanceof Error ? error.name : "unknown error");
      sendError(res, 503, "Não foi possível entrar agora. Tente novamente mais tarde.", "AUTH_UNAVAILABLE");
    } finally {
      activePasswordChecks -= 1;
    }
  });

  router.post("/logout", async (req, res) => {
    if (!requestIsSameOrigin(req)) return sendError(res, 403, "Não foi possível validar esta solicitação.", "REQUEST_REJECTED");
    try {
      const current = await readSession(req, store);
      if (current && !csrfMatches(current.session.csrfToken, req.get("X-CSRF-Token"))) {
        return sendError(res, 403, "Sua sessão precisa ser validada novamente.", "CSRF_INVALID");
      }
      if (current) await store.deleteSession(current.tokenHash);
      clearSessionCookie(req, res);
      res.json({ success: true });
    } catch {
      sendError(res, 503, "Não foi possível encerrar a sessão agora. Tente novamente.", "AUTH_UNAVAILABLE");
    }
  });

  router.patch("/profile", async (req, res) => {
    if (!requestIsSameOrigin(req)) return sendError(res, 403, "Não foi possível validar esta solicitação.", "REQUEST_REJECTED");
    try {
      const current = await readSession(req, store);
      if (!current) {
        clearSessionCookie(req, res);
        return sendError(res, 401, "Entre novamente para continuar.", "UNAUTHENTICATED");
      }
      if (!csrfMatches(current.session.csrfToken, req.get("X-CSRF-Token"))) return sendError(res, 403, "Sua sessão precisa ser validada novamente.", "CSRF_INVALID");
      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) return sendError(res, 400, "Informe um nome com 2 a 60 caracteres.", "INVALID_INPUT");
      const user = await store.updateName(current.session.user.id, parsed.data.name);
      if (!user) return sendError(res, 404, "Não foi possível localizar esta conta.", "ACCOUNT_NOT_FOUND");
      res.json(publicUser(user));
    } catch {
      sendError(res, 503, "Não foi possível atualizar seu perfil agora. Tente novamente.", "AUTH_UNAVAILABLE");
    }
  });

  return router;
}
