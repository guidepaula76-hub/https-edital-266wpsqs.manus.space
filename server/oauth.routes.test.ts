import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
    createSessionToken: mocks.createSessionToken,
  },
}));
vi.mock("./db", () => ({ upsertUser: mocks.upsertUser }));

import { encodeOAuthState } from "@shared/const";
import { registerOAuthRoutes } from "./_core/oauth";

const servers: Server[] = [];

async function startApp() {
  const app = express();
  registerOAuthRoutes(app);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.exchangeCodeForToken.mockResolvedValue({ accessToken: "access-token" });
  mocks.getUserInfo.mockResolvedValue({
    openId: "oauth-user-1",
    name: "Aluno",
    email: "aluno@example.test",
    loginMethod: "google",
  });
  mocks.createSessionToken.mockResolvedValue("signed-session-token");
  mocks.upsertUser.mockResolvedValue(undefined);
});

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("OAuth callback state validation", () => {
  it("rejects a callback without the one-time state cookie before exchanging the code", async () => {
    const base = await startApp();
    const state = encodeOAuthState({ redirectUri: `${base}/api/oauth/callback`, nonce: "expected-nonce" });
    const response = await fetch(`${base}/api/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`);

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "invalid oauth state" });
    expect(mocks.exchangeCodeForToken).not.toHaveBeenCalled();
  });

  it("rejects a mismatched one-time state cookie before exchanging the code", async () => {
    const base = await startApp();
    const state = encodeOAuthState({ redirectUri: `${base}/api/oauth/callback`, nonce: "expected-nonce" });
    const response = await fetch(`${base}/api/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`, {
      headers: { Cookie: "__Host-oauth_state=attacker-nonce" },
    });

    expect(response.status).toBe(403);
    expect(mocks.exchangeCodeForToken).not.toHaveBeenCalled();
  });

  it("creates the application session only after the state cookie matches", async () => {
    const base = await startApp();
    const state = encodeOAuthState({ redirectUri: `${base}/api/oauth/callback`, nonce: "expected-nonce" });
    const response = await fetch(`${base}/api/oauth/callback?code=auth-code&state=${encodeURIComponent(state)}`, {
      headers: { Cookie: "__Host-oauth_state=expected-nonce" },
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/");
    expect(mocks.exchangeCodeForToken).toHaveBeenCalledWith("auth-code", state);
    expect(mocks.upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "oauth-user-1" }));
    expect(mocks.createSessionToken).toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("webdev_app_session=signed-session-token");
  });
});
