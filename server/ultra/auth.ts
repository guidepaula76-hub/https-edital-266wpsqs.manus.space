import type { Request, RequestHandler } from "express";
import { authStore, type AuthStore, type StoredSession } from "../_core/auth/store";
import { csrfMatches, readSession, requestIsSameOrigin, sendError } from "../_core/auth/routes";

export type UltraSessionContext = {
  user: StoredSession["user"];
  csrfToken: string;
};

export type UltraRequest = Request & {
  ultra?: UltraSessionContext;
};

/**
 * Reuses the exact cookie/session store used by /api/auth.
 * Study endpoints must use this middleware rather than tRPC's platform OAuth context.
 */
export function createUltraSessionMiddleware(store: AuthStore = authStore): {
  requireSession: RequestHandler;
  requireMutation: RequestHandler;
} {
  const requireSession: RequestHandler = (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    void readSession(req, store).then(current => {
      if (!current) {
        sendError(res, 401, "Entre novamente para continuar.", "UNAUTHENTICATED");
        return;
      }
      (req as UltraRequest).ultra = {
        user: current.session.user,
        csrfToken: current.session.csrfToken,
      };
      next();
    }).catch(() => {
      sendError(res, 503, "Não foi possível verificar sua sessão agora. Tente novamente.", "AUTH_UNAVAILABLE");
    });
  };

  const requireMutation: RequestHandler = (req, res, next) => {
    if (!requestIsSameOrigin(req)) {
      sendError(res, 403, "Não foi possível validar esta solicitação.", "REQUEST_REJECTED");
      return;
    }
    requireSession(req, res, () => {
      const session = (req as UltraRequest).ultra;
      if (!session || !csrfMatches(session.csrfToken, req.get("X-CSRF-Token"))) {
        sendError(res, 403, "Sua sessão precisa ser validada novamente.", "CSRF_INVALID");
        return;
      }
      next();
    });
  };

  return { requireSession, requireMutation };
}

const productionMiddleware = createUltraSessionMiddleware();
export const requireSession = productionMiddleware.requireSession;
export const requireMutation = productionMiddleware.requireMutation;
