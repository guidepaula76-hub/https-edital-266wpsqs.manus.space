import { useState } from "react";
import { useLocation } from "wouter";
import {
  Pencil,
  Flame,
  Gem,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  ArrowRight,
  CalendarDays,
  Check,
  ShieldCheck,
  BookX,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useProgress, daysUntilExam } from "@/lib/progress";
import {
  Card,
  MechButton,
  SectionHeading,
  ProgressBar,
  Tag,
  DemoNote,
  Modal,
  Frog,
} from "@/components/ultra/UI";
import Install from "@/components/ultra/Install";
import "./profile.css";
export default function Profile() {
  const { state, updateProfile, setSound } = useProgress();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const complete = state.completedNodes.length;
  const totalNodes = state.nodes.length;
  const trailProgress = totalNodes ? Math.round((complete / totalNodes) * 100) : 0;
  return (
    <>
      <SectionHeading
        eyebrow="O SEU PRÓXIMO CAPÍTULO"
        title="Seu perfil de conquistas"
        description="Um lugar para cuidar da sua jornada."
      />
      <div className="profile-columns">
        <div className="profile-primary">
          <Card className="profile-summary">
            <div className="profile-avatar">
              {state.profile.name.slice(0, 1).toUpperCase()}
              <span>
                <Check size={13} />
              </span>
            </div>
            <div>
              <h2>{state.profile.name}</h2>
              <p>Um salto mais perto do seu objetivo.</p>
              <Tag tone="purple">
                Explorador · Nível {Math.floor(state.xp / 500) + 1}
              </Tag>
            </div>
            <button
              className="icon-button"
              onClick={() => setEdit(true)}
              aria-label="Editar nome"
            >
              <Pencil size={16} />
            </button>
          </Card>
          <div className="profile-stats">
            <Card>
              <span className="profile-stat-icon purple">
                <Gem size={23} />
              </span>
              <strong>{state.xp.toLocaleString("pt-BR")}</strong>
              <small>XP conquistados</small>
            </Card>
            <Card>
              <span className="profile-stat-icon orange">
                <Flame size={24} />
              </span>
              <strong>{state.streak}</strong>
              <small>Dias de ofensiva</small>
            </Card>
            <Card>
              <span className="profile-stat-icon green">
                <Check size={23} />
              </span>
              <strong>{complete}</strong>
              <small>Unidades concluídas</small>
            </Card>
          </div>
          <Card className="profile-goal">
            <div className="row-between">
              <div className="inline-row">
                <span className="profile-section-icon">
                  <CalendarDays size={19} />
                </span>
                <h3>Seu objetivo</h3>
              </div>
              <MechButton
                color="white"
                small
                onClick={() => navigate("/onboarding")}
              >
                Ajustar <Pencil size={13} />
              </MechButton>
            </div>
            <h2>{state.profile.concurso}</h2>
            <p>
              {state.profile.cargo} · {state.profile.banca}
            </p>
            <div className="row-between">
              <span>Progresso da trilha</span>
              <strong>{trailProgress}%</strong>
            </div>
            <ProgressBar value={trailProgress} color="purple" />
            <div className="goal-details">
              <span>
                <CalendarDays size={14} />{" "}
                {daysUntilExam(state.profile.examDate)} dias até a prova
              </span>
              <span>{state.profile.hours} h de estudo por dia</span>
            </div>
          </Card>
          <Card className="errors-card">
            <div className="row-between">
              <div className="inline-row">
                <span className="profile-section-icon coral">
                  <BookX size={20} />
                </span>
                <h3>Caderno de erros</h3>
              </div>
              <Tag tone="coral">{state.errorIds.length} para revisar</Tag>
            </div>
            <p className="muted">
              Um erro entendido vira um acerto na próxima vez.
            </p>
            {state.errorIds.length ? (
              <div className="error-list">
                {state.errors.map((entry, i) => (
                  <div key={entry.questionId}>
                    <span className="error-number">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{entry.topic}</strong>
                      <small>{entry.subject} · {entry.errorCount} {entry.errorCount === 1 ? "erro" : "erros"} · {entry.board}</small>
                    </div>
                    <MechButton small color="white" onClick={() => navigate("/app/questoes?error=" + entry.questionId)}>
                      Refazer <ArrowRight size={13} />
                    </MechButton>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-errors">
                <Frog pose="cheer" />
                <h3>Tudo revisado por aqui!</h3>
                <p>Continue praticando na sua trilha.</p>
              </div>
            )}
          </Card>
        </div>
        <aside className="profile-secondary">
          <Card className="preferences-card">
            <h3>Do seu jeito</h3>
            <p>Pequenos ajustes para estudar melhor.</p>
            <div className="preference-row">
              <span className="preference-icon">
                {theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
              </span>
              <div>
                <strong>Tema {theme === "dark" ? "escuro" : "claro"}</strong>
                <small>Conforto para ler por mais tempo</small>
              </div>
              <button
                className={`toggle ${theme === "dark" ? "on" : ""}`}
                role="switch"
                aria-checked={theme === "dark"}
                aria-label="Ativar tema escuro"
                onClick={toggleTheme}
              >
                <span />
              </button>
            </div>
            <div className="preference-row">
              <span className="preference-icon">
                {state.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
              </span>
              <div>
                <strong>Som de clique</strong>
                <small>Um toque suave, se você quiser</small>
              </div>
              <button
                className={`toggle ${state.sound ? "on" : ""}`}
                role="switch"
                aria-checked={state.sound}
                aria-label="Ativar som de clique"
                onClick={() => setSound(!state.sound)}
              >
                <span />
              </button>
            </div>
            <div className="preferences-note">
              <ShieldCheck size={15} />
              <p>
                Suas preferências e conquistas são vinculadas à sua conta e carregadas do servidor.
              </p>
            </div>
          </Card>
          <Card className="install-card">
            <span className="install-card-icon">
              <Download size={27} />
            </span>
            <h3>Sua jornada no bolso.</h3>
            <p>
              Adicione o Ultra à tela inicial e transforme o próximo passo em
              hábito.
            </p>
            <Install small />
          </Card>

        </aside>
      </div>
      <DemoNote />
      {edit && (
        <Modal title="Como podemos chamar você?" onClose={() => setEdit(false)}>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!name.trim()) return;
              updateProfile({ name: name.trim() });
              setEdit(false);
              toast.success("Seu perfil ficou mais seu.");
            }}
          >
            <div className="form-field">
              <label htmlFor="profile-name">Nome</label>
              <input
                id="profile-name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={50}
                required
              />
            </div>
            <MechButton type="submit" className="full-width">
              Salvar nome <Check size={16} />
            </MechButton>
          </form>
        </Modal>
      )}

    </>
  );
}
