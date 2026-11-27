import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createAuthRouter } from "../_core/auth/routes";
import { createUltraSessionMiddleware, type UltraRequest } from "./auth";
import { DuplicateEmailError, type AuthStore, type AuthCredential, type AuthUser, type NewSession, type StoredSession } from "../_core/auth/store";

function makeStore(): AuthStore {
  const accounts = new Map<string, AuthUser & { passwordHash: string }>();
  const sessions = new Map<string, StoredSession>();
  let nextId = 1;
  return {
    async createAccount(input) {
      if (accounts.has(input.email)) throw new DuplicateEmailError();
      const account = { id: nextId++, name: input.name, email: input.email, method: "email", passwordHash: input.passwordHash };
      accounts.set(input.email, account);
      sessions.set(input.tokenHash, { user: { id: account.id, name: account.name, email: account.email, method: account.method }, csrfToken: input.csrfToken, expiresAt: input.expiresAt });
      return { id: account.id, name: account.name, email: account.email, method: account.method };
    },
    async findCredential(email): Promise<AuthCredential | null> {
      const account = accounts.get(email);
      return account ? { user: { id: account.id, name: account.name, email: account.email, method: account.method }, passwordHash: account.passwordHash } : null;
    },
    async createSession(userId: number, session: NewSession) {
      const account = [...accounts.values()].find(item => item.id === userId);
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
      const account = [...accounts.values()].find(item => item.id === userId);
      if (!account) return null;
      account.name = name;
      return { id: account.id, name, email: account.email, method: account.method };
    },
  };
}

const servers: Server[] = [];
async function startApp() {
  const store = makeStore();
  const app = express();
  app.use(express.json());
  app.use("/api/auth", createAuthRouter(store));
  const middleware = createUltraSessionMiddleware(store);
  app.get("/api/study/private", middleware.requireSession, (req, res) => {
    res.json({ userId: (req as UltraRequest).ultra?.user.id });
  });
  app.patch("/api/study/private", middleware.requireMutation, (req, res) => {
    res.json({ userId: (req as UltraRequest).ultra?.user.id });
  });
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("Ultra REST study authentication", () => {
  it("uses the existing login cookie and scopes the request to its session user", async () => {
    const base = await startApp();
    const signup = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Ultra-Request": "1" },
      body: JSON.stringify({ name: "Aluno Teste", email: "aluno@test.local", password: "senha-segura-123" }),
    });
    expect(signup.status).toBe(201);
    const auth = await signup.json() as { user: AuthUser; csrfToken: string };
    const cookie = (signup.headers.get("set-cookie") ?? "").split(";")[0];

    const anonymous = await fetch(`${base}/api/study/private`);
    expect(anonymous.status).toBe(401);

    const privateRead = await fetch(`${base}/api/study/private`, { headers: { Cookie: cookie } });
    expect(privateRead.status).toBe(200);
    expect(await privateRead.json()).toEqual({ userId: auth.user.id });
  });

  it("rejects cross-origin auth mutations even when the custom JSON header is present", async () => {
    const base = await startApp();
    const response = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ultra-Request": "1",
        Origin: "https://attacker.example",
      },
      body: JSON.stringify({ name: "Aluno Teste", email: "origin@test.local", password: "senha-segura-123" }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "REQUEST_REJECTED" });
  });

  it("accepts an explicit matching origin for auth mutations", async () => {
    const base = await startApp();
    const response = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ultra-Request": "1",
        Origin: base,
      },
      body: JSON.stringify({ name: "Aluno Teste", email: "same-origin@test.local", password: "senha-segura-123" }),
    });
    expect(response.status).toBe(201);
  });

  it("requires same-origin JSON and the session CSRF token for mutations", async () => {
    const base = await startApp();
    const signup = await fetch(`${base}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Ultra-Request": "1" },
      body: JSON.stringify({ name: "Aluno Teste", email: "csrf@test.local", password: "senha-segura-123" }),
    });
    const auth = await signup.json() as { csrfToken: string };
    const cookie = (signup.headers.get("set-cookie") ?? "").split(";")[0];

    const noToken = await fetch(`${base}/api/study/private`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Ultra-Request": "1", Cookie: cookie },
      body: "{}",
    });
    expect(noToken.status).toBe(403);

    const valid = await fetch(`${base}/api/study/private`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Ultra-Request": "1", "X-CSRF-Token": auth.csrfToken, Cookie: cookie },
      body: "{}",
    });
    expect(valid.status).toBe(200);
  });
});
