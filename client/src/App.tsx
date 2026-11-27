import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ProgressProvider } from "@/lib/progress";
import Shell from "@/components/ultra/Shell";
import Landing from "@/pages/Landing";
import { Auth, Onboarding } from "@/pages/Entry";
import NotFound from "@/pages/NotFound";
const Dashboard = lazy(() => import("@/features/Dashboard"));
const Trail = lazy(() => import("@/features/Trail"));
const Questions = lazy(() => import("@/features/Questions"));
const Contents = lazy(() => import("@/features/Contents"));
const Ranking = lazy(() => import("@/features/Ranking"));
const Profile = lazy(() => import("@/features/Profile"));
function Loading() {
  return (
    <div className="app-loading">
      <span />
      <p>Preparando seu próximo passo…</p>
    </div>
  );
}
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user && !error) navigate("/login");
  }, [loading, user, error, navigate]);

  if (loading) return <Loading />;
  if (error && !user) {
    return (
      <div className="app-loading" role="alert">
        <p>Não foi possível verificar sua sessão. Sua conta não foi desconectada.</p>
        <button type="button" onClick={() => void refresh()}>Tentar novamente</button>
      </div>
    );
  }
  if (!user) return <Loading />;
  return <>{children}</>;
}
function AppRoute({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </Shell>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AuthProvider>
          <ProgressProvider>
            <MotionConfig reducedMotion="user">
              <TooltipProvider>
                <Toaster />
                <Switch>
                  <Route path="/" component={Landing} />
                  <Route path="/login">
                    <Auth />
                  </Route>
                  <Route path="/cadastro">
                    <Auth signup />
                  </Route>
                  <Route path="/onboarding"><ProtectedRoute><Onboarding /></ProtectedRoute></Route>
                  <Route path="/app">
                    <ProtectedRoute>
                      <AppRoute>
                        <Dashboard />
                      </AppRoute>
                    </ProtectedRoute>
                  </Route>
                  <Route path="/app/trilha">
                    <ProtectedRoute>
                      <AppRoute>
                        <Trail />
                      </AppRoute>
                    </ProtectedRoute>
                  </Route>
                  <Route path="/app/questoes">
                    <ProtectedRoute>
                      <AppRoute>
                        <Questions />
                      </AppRoute>
                    </ProtectedRoute>
                  </Route>
                  <Route path="/app/conteudos">
                    <ProtectedRoute>
                      <AppRoute>
                        <Contents />
                      </AppRoute>
                    </ProtectedRoute>
                  </Route>
                  <Route path="/app/ranking">
                    <ProtectedRoute>
                      <AppRoute>
                        <Ranking />
                      </AppRoute>
                    </ProtectedRoute>
                  </Route>
                  <Route path="/app/perfil">
                    <ProtectedRoute>
                      <AppRoute>
                        <Profile />
                      </AppRoute>
                    </ProtectedRoute>
                  </Route>
                  <Route path="/404" component={NotFound} />
                  <Route component={NotFound} />
                </Switch>
              </TooltipProvider>
            </MotionConfig>
          </ProgressProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
