import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthResponse, PublicUser } from "@shared/ultra";
import { api, setCsrfToken } from "./api";

type AuthContextValue = {
  user: PublicUser | null; loading: boolean; error: string | null; googleEnabled: boolean;
  login(email: string, password: string): Promise<PublicUser>;
  signup(name: string, email: string, password: string): Promise<PublicUser>;
  logout(): Promise<void>; refresh(): Promise<void>; updateName(name: string): Promise<void>;
  googleLogin(): Promise<void>;
};
const Context = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const popup = useRef<Window | null>(null);
  const request = useRef(0);
  const apply = useCallback((data: AuthResponse) => {
    setCsrfToken(data.csrfToken); setUser(data.user); setGoogleEnabled(data.googleEnabled); setError(null);
  }, []);
  const refresh = useCallback(async () => {
    const revision = ++request.current;
    try {
      const data = await api<AuthResponse>("/api/auth/me");
      if (revision === request.current) apply(data);
    } catch (e) {
      if (revision === request.current) setError(e instanceof Error ? e.message : "Não foi possível verificar a sessão.");
    } finally { if (revision === request.current) setLoading(false); }
  }, [apply]);
  useEffect(() => {
    void refresh();
    const expired = () => { ++request.current; setCsrfToken(null); setUser(null); setError(null); };
    const received = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.source === popup.current && e.data?.type === "ultra-auth-complete") void refresh();
    };
    const focused = () => { if (popup.current) void refresh(); };
    window.addEventListener("ultra-session-expired", expired);
    window.addEventListener("message", received);
    window.addEventListener("focus", focused);
    return () => { window.removeEventListener("ultra-session-expired", expired); window.removeEventListener("message", received); window.removeEventListener("focus", focused); };
  }, [refresh]);
  const authenticate = async (path: string, body: unknown) => {
    ++request.current;
    const data = await api<AuthResponse>(path, { method: "POST", body });
    if (!data.user) throw new Error("Não foi possível iniciar uma sessão.");
    apply(data); setLoading(false);
    return data.user;
  };
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST", body: {} });
    ++request.current; setCsrfToken(null); setUser(null); setError(null);
    localStorage.removeItem("ultraconcursos-demo-v1");
    window.dispatchEvent(new Event("ultra-logout"));
  };
  const updateName = async (name: string) => {
    const updated = await api<PublicUser>("/api/auth/profile", { method: "PATCH", body: { name } });
    setUser(updated);
  };
  const googleLogin = async () => {
    const opened = window.open("about:blank", "ultra-google-login", "popup,width=520,height=700");
    if (!opened) throw new Error("Permita pop-ups para entrar com Google.");
    popup.current = opened;
    try {
      const { url } = await api<{ url: string }>("/api/auth/google/start", { method: "POST", body: { origin: window.location.origin } });
      opened.location.href = url;
    } catch (e) { opened.close(); popup.current = null; throw e; }
  };
  return <Context.Provider value={{ user, loading, error, googleEnabled, refresh, logout, updateName, googleLogin,
    login: (email, password) => authenticate("/api/auth/login", { email, password }),
    signup: (name, email, password) => authenticate("/api/auth/signup", { name, email, password }),
  }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider ausente."); return value; }
