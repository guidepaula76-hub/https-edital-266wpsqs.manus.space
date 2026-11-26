import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { configureBodyParsers } from "./bodyParser";

const servers: Server[] = [];
async function startTestApp() {
  const app = express();
  configureBodyParsers(app);
  app.post("/api/study/verticalize-pdf", (req, res) => res.json({ length: req.body.payload.length }));
  app.post("/api/other", (req, res) => res.json({ length: req.body.payload.length }));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  servers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}
async function post(base: string, path: string, payload: string) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))));
});

describe("request body limits", () => {
  it("allows the larger body only on the PDF verticalization endpoint", async () => {
    const base = await startTestApp();
    const payload = "x".repeat(1_100_000);
    const pdfResponse = await post(base, "/api/study/verticalize-pdf", payload);
    expect(pdfResponse.status).toBe(200);
    expect(await pdfResponse.json()).toEqual({ length: payload.length });

    const regularResponse = await post(base, "/api/other", payload);
    expect(regularResponse.status).toBe(413);
  });
});
