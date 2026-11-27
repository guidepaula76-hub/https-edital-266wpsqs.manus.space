import express, { type Express } from "express";

const pdfEndpoint = "/api/study/verticalize-pdf";

/**
 * Keep ordinary API payloads small. The PDF endpoint is skipped here so its
 * larger parser can run only after session and CSRF middleware on that route.
 */
export function configureBodyParsers(app: Express) {
  app.use((req, res, next) => {
    if (req.path === pdfEndpoint || req.path === `${pdfEndpoint}/`) {
      next();
      return;
    }
    express.json({ limit: "1mb" })(req, res, next);
  });
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
}
