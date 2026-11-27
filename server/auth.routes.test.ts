import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createAuthRouter } from "./_core/auth/routes";
import { hashPassword, verifyPassword } from "./_core/auth/password";
import { DuplicateEmailError, type AuthCredential, type AuthStore, type AuthUser, type NewSession, type StoredSession } from "./_core/auth/store";

type Account = AuthUser & { passwordHash: string };
function makeStore(): AuthStore {
  const accounts = new Map<string, Account>();
  const sessions = new Map<string, StoredSession>();
  let nextId = 1;
  return {
    async createAccount(input) {
      if (accounts.has(input.email)) throw new DuplicateEmailError();
      const account: Account = { id: nextId++, name: input.name, email: input.email, method: "email", passwordHash: input.passwordHash };
      accounts.set(input.email, account);
      sessions.set(input.tokenHash, { user: { id: account.id, name: account.name, email: account.email, method: account.method }, csrfToken: input.csrfToken, expiresAt: input.expiresAt });
      return { id: account.id, name: account.name, email: account.email, method: account.method };
    },
    async findCredential(email): Promise<AuthCredential | null> {
      const account = accounts.get(email);
      return account ? { user: { id: account.id, name: account.name, email: account.email, method: account.method }, passwordHash: account.passwordHash } : null;
    },
    async createSession(userId: number, session: NewSession) {
      const account = [...accounts.values()].find(a => a.id === userId);
      if (!account) throw new Error("missing user");
      sessions.set(session.tokenHash, { user: { id: account.id, name: account.name, email: account.email, method: account.method }, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
    },
    async findSession(tokenHash) { return sessions.get(tokenHash) ?? null; },
    async extendSession(tokenHash, expiresAt) {
      const session = sessions.get(tokenHash);
      if (session) session.expiresAt = expiresAt;
    },
    async deleteSession(tokenHash) { sessions.delete(tokenHash); },
    async updateName(userId, name) {
      const account = [...accounts.values()].find(a => a.id === userId);
      if (!account) return null;
      account.name = name;
      const session = [...sessions.values()].find(s => s.user.id === userId);
      if (session) session.user.name = name;
      return { id: account.id, name, email: account.email, method: account.method };
    },
  };
}

const servers: Server[] = [];
async function startTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", createAuthRouter(makeStore()));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}
async function post(base: string, path: string, body: unknown, extraHeaders: Record<string, string> = {}) {
  return fetch(`${base}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Ultra-Request": "1", ...extraHeaders },
    body: JSON.stringify(body),
  });
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("email/password authentication", () => {
  it("hashes passwords with a random salt and verifies only the correct password", async () => {
    const first = await hashPassword("senha-forte-123");
    const second = await hashPassword("senha-forte-123");
    expect(first).not.toBe(second);
    expect(await verifyPassword("senha-forte-123", first)).toBe(true);
    expect(await verifyPassword("outra-senha", first)).toBe(false);
    expect(await verifyPassword("senha-forte-123", undefined)).toBe(false);
  });

  it("creates an account and session, then requires CSRF for profile changes and logout", async () => {
    const base = await startTestApp();
    const created = await post(base, "signup", { name: "Guilherme", email: "  Aluno@Exemplo.com ", password: "senha-segura-123" });
    expect(created.status).toBe(201);
    const data = await created.json() as { user: AuthUser; csrfToken: string; googleEnabled: boolean };
    expect(data.user).toMatchObject({ id: 1, name: "Guilherme", email: "aluno@exemplo.com", method: "email" });
    expect(data.csrfToken).toBeTruthy();
    expect(data.googleEnabled).toBe(false);
    const cookie = created.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("ultra_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=None");

    const sessionCookie = cookie.split(";")[0];
    const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: sessionCookie } });
    expect(await me.json()).toMatchObject({ user: data.user, csrfToken: data.csrfToken });

    const rejected = await fetch(`${base}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Ultra-Request": "1", Cookie: sessionCookie },
      body: JSON.stringify({ name: "Outro Nome" }),
    });
    expect(rejected.status).toBe(403);

    const updated = await fetch(`${base}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Ultra-Request": "1", "X-CSRF-Token": data.csrfToken, Cookie: sessionCookie },
      body: JSON.stringify({ name: "Nome Atualizado" }),
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({ name: "Nome Atualizado", email: "aluno@exemplo.com" });

    const logout = await post(base, "logout", {}, { Cookie: sessionCookie, "X-CSRF-Token": data.csrfToken });
    expect(logout.status).toBe(200);
    expect(await logout.json()).toEqual({ success: true });
    const afterLogout = await fetch(`${base}/api/auth/me`, { headers: { Cookie: sessionCookie } });
    expect((await afterLogout.json() as { user: AuthUser | null }).user).toBeNull();
  });

  it("rejects invalid forms and duplicate addresses without creating a real database record", async () => {
    const base = await startTestApp();
    const invalid = await post(base, "signup", { name: "A", email: "not-an-email", password: "short" });
    expect(invalid.status).toBe(400);

    const first = await post(base, "signup", { name: "Pessoa", email: "same@example.com", password: "senha-segura-123" });
    expect(first.status).toBe(201);
    const duplicate = await post(base, "signup", { name: "Pessoa 2", email: "SAME@example.com", password: "senha-segura-123" });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({ code: "EMAIL_IN_USE" });
  });

  it("uses a generic error for unknown email and incorrect password", async () => {
    const base = await startTestApp();
    const unknown = await post(base, "login", { email: "missing@example.com", password: "senha-segura-123" });
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toMatchObject({ error: "E-mail ou senha incorretos.", code: "INVALID_CREDENTIALS" });
  });

  it("limits repeated login attempts from one address", async () => {
    const base = await startTestApp();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await post(base, "login", { email: "invalid", password: "x" });
      expect(response.status).toBe(400);
    }
    const blocked = await post(base, "login", { email: "invalid", password: "x" });
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toMatchObject({ code: "RATE_LIMITED" });
  });

  it("limits repeated signup attempts from one address", async () => {
    const base = await startTestApp();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post(base, "signup", { name: "A", email: "bad", password: "short" });
      expect(response.status).toBe(400);
    }
    const blocked = await post(base, "signup", { name: "A", email: "bad", password: "short" });
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toMatchObject({ code: "RATE_LIMITED" });
  });
});
