import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/lib/auth";
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
                  <Route path="/onboarding" component={Onboarding} />
                  <Route path="/app">
                    <AppRoute>
                      <Dashboard />
                    </AppRoute>
                  </Route>
                  <Route path="/app/trilha">
                    <AppRoute>
                      <Trail />
                    </AppRoute>
                  </Route>
                  <Route path="/app/questoes">
                    <AppRoute>
                      <Questions />
                    </AppRoute>
                  </Route>
                  <Route path="/app/conteudos">
                    <AppRoute>
                      <Contents />
                    </AppRoute>
                  </Route>
                  <Route path="/app/ranking">
                    <AppRoute>
                      <Ranking />
                    </AppRoute>
                  </Route>
                  <Route path="/app/perfil">
                    <AppRoute>
                      <Profile />
                    </AppRoute>
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
