let csrfToken: string | null = null;
export function setCsrfToken(value: string | null) { csrfToken = value; }
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
export async function api<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { "X-Ultra-Request": "1" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  try {
    const response = await fetch(path, {
      method, headers, credentials: "include", cache: "no-store",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? AbortSignal.timeout(115000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && !path.startsWith("/api/auth/")) window.dispatchEvent(new Event("ultra-session-expired"));
      throw new ApiError(data?.error ?? "Não foi possível concluir. Tente novamente.", response.status, data?.code);
    }
    if (data === null) throw new ApiError("O servidor não retornou uma resposta válida.", response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name)) throw new ApiError("A operação demorou mais que o esperado. Tente novamente.", 408, "TIMEOUT");
    throw new ApiError("Sem conexão com o servidor. Confira sua internet e tente novamente.", 0, "NETWORK");
  }
}
