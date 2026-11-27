import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Home,
  Route,
  ListChecks,
  BookOpen,
  Trophy,
  UserRound,
  Flame,
  Gem,
  Bell,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Brand, Frog, MechButton, Modal } from "./UI";
import { useProgress } from "@/lib/progress";
import Tutor from "./Tutor";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import "./shell.css";

export const navigation = [
  { path: "/app", label: "Início", icon: Home },
  { path: "/app/trilha", label: "Trilha", icon: Route },
  { path: "/app/questoes", label: "Questões", icon: ListChecks },
  { path: "/app/conteudos", label: "Conteúdos", icon: BookOpen },
  { path: "/app/ranking", label: "Ranking", icon: Trophy },
  { path: "/app/perfil", label: "Perfil", icon: UserRound },
];
export default function Shell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { state } = useProgress();
  const auth = useAuth();
  const [notifications, setNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const exit = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sair da conta.");
    } finally {
      setLoggingOut(false);
    }
  };
  const active =
    navigation.find(item => item.path === location) ?? navigation[0];
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Brand />
        <div className="sidebar-label">SEU ESPAÇO DE EVOLUÇÃO</div>
        <nav aria-label="Menu principal">
          {navigation.map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${location === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              aria-current={location === item.path ? "page" : undefined}
            >
              <item.icon size={21} />
              <span>{item.label}</span>
              {location === item.path && (
                <ChevronRight className="nav-chevron" size={16} />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-encourage">
            <Frog pose="support" decorative />
            <strong>Seu futuro agradece.</strong>
            <p>
              Um pouquinho todo dia
              <br />
              faz uma grande diferença.
            </p>
          </div>
          <button className="sidebar-exit" onClick={() => void exit()} disabled={loggingOut}>
            <LogOut size={16} /> {loggingOut ? "Saindo…" : "Sair da conta"}
          </button>
          <span className="sidebar-demo">PROTÓTIPO · ETAPA 1</span>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar">
          <div className="topbar-left">
            <div className="mobile-brand">
              <Brand compact />
            </div>
            <span className="topbar-section">{active.label}</span>
            <span className="topbar-divider" />
            <span className="topbar-message">
              Hoje é um bom dia para aprender.
            </span>
          </div>
          <div className="topbar-stats">
            <div className="stat-pill xp-pill" title="Pontos de experiência">
              <Gem size={19} />
              <strong>{state.xp.toLocaleString("pt-BR")}</strong>
              <small>XP</small>
            </div>
            <div
              className="stat-pill streak-pill"
              title="Dias de estudo em sequência"
            >
              <Flame size={20} />
              <strong>{state.streak}</strong>
              <small>dias</small>
            </div>
            <button
              className="notification-button"
              aria-label="Notificações"
              onClick={() => setNotifications(true)}
            >
              <Bell size={18} />
              <i />
            </button>
            <button
              className="user-avatar"
              onClick={() => navigate("/app/perfil")}
              aria-label="Abrir perfil"
            >
              {state.profile.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <motion.main
          className="app-main"
          key={location}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
        >
          {children}
        </motion.main>
      </div>
      <nav
        className="mobile-bottom-nav"
        aria-label="Navegação principal mobile"
      >
        {navigation.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={location === item.path ? "active" : ""}
            aria-current={location === item.path ? "page" : undefined}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <Tutor />
      {notifications && (
        <Modal
          title="Seu próximo pequeno passo"
          onClose={() => setNotifications(false)}
        >
          <div className="notification-content">
            <div className="notification-badge">
              <Sparkles size={25} />
            </div>
            <h3>Há uma unidade esperando por você!</h3>
            <p>
              Continue sua trilha e ganhe 50 XP ao concluir a sessão. As
              notificações desta versão são demonstrativas.
            </p>
            <MechButton
              className="full-width"
              onClick={() => {
                setNotifications(false);
                navigate("/app/trilha");
              }}
            >
              Continuar minha trilha <ChevronRight size={18} />
            </MechButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
