import express, { type Express } from "express";

/**
 * Keep ordinary unauthenticated/API payloads small. The PDF endpoint is the
 * only route that needs a larger JSON body because it receives an 8 MiB PDF
 * encoded as base64 (about 10.7 MiB before JSON overhead).
 */
export function configureBodyParsers(app: Express) {
  app.use("/api/study/verticalize-pdf", express.json({ limit: "12mb" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
}
