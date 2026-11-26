import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { configureBodyParsers } from "./bodyParser";

const servers: Server[] = [];
async function startTestApp() {
  const app = express();
  configureBodyParsers(app);
  const requireTestSession: express.RequestHandler = (req, res, next) => {
    if (req.get("Authorization") !== "Bearer test") {
      res.status(401).end();
      return;
    }
    next();
  };
  app.post(
    "/api/study/verticalize-pdf",
    requireTestSession,
    express.json({ limit: "12mb" }),
    (req, res) => res.json({ length: req.body.payload.length }),
  );
  app.post("/api/other", (req, res) => res.json({ length: req.body.payload.length }));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}
async function post(base: string, path: string, payload: string, authenticated = false) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authenticated ? { Authorization: "Bearer test" } : {}),
    },
    body: JSON.stringify({ payload }),
  });
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("request body limits", () => {
  it("parses larger PDF bodies only after session middleware", async () => {
    const base = await startTestApp();
    const payload = "x".repeat(1_100_000);

    const unauthenticated = await post(base, "/api/study/verticalize-pdf", payload);
    expect(unauthenticated.status).toBe(401);

    const authenticated = await post(base, "/api/study/verticalize-pdf", payload, true);
    expect(authenticated.status).toBe(200);
    expect(await authenticated.json()).toEqual({ length: payload.length });

    const regularResponse = await post(base, "/api/other", payload);
    expect(regularResponse.status).toBe(413);
  });
});
