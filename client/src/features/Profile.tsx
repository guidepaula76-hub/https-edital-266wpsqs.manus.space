import { useState } from "react";
import { useLocation } from "wouter";
import {
  UserRound,
  Pencil,
  Flame,
  Gem,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  ArrowRight,
  CalendarDays,
  LogOut,
  RotateCcw,
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
const errors: Record<string, { subject: string; title: string }> = {
  "demo-portugues-2": {
    subject: "Língua Portuguesa",
    title: "Emprego de crase e regência verbal",
  },
  "demo-admin-1": {
    subject: "Direito Administrativo",
    title: "Princípios da administração pública",
  },
};
export default function Profile() {
  const { state, updateProfile, setSound, resetProgress } = useProgress();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const complete = state.completedNodes.length;
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
              <strong>{Math.round((complete / 12) * 100)}%</strong>
            </div>
            <ProgressBar value={(complete / 12) * 100} color="purple" />
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
                {state.errorIds.map((id, i) => (
                  <div key={id}>
                    <span className="error-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>
                        {errors[id]?.title ??
                          "Questão para refazer e consolidar"}
                      </strong>
                      <small>
                        {errors[id]?.subject ?? "Prática da sua banca"} ·
                        revisão recomendada
                      </small>
                    </div>
                    <MechButton
                      small
                      color="white"
                      onClick={() =>
                        navigate(
                          `/app/questoes?error=${encodeURIComponent(id)}`
                        )
                      }
                    >
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
                Suas preferências e conquistas ficam apenas neste dispositivo.
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
          <Card className="profile-demo-card">
            <Tag tone="purple">ETAPA 1 · DEMONSTRAÇÃO</Tag>
            <p>
              Este perfil não é uma conta real. O ranking, o tutor e as
              avaliações de redação são fictícios.
            </p>
            <button onClick={() => setConfirmReset(true)}>
              <RotateCcw size={13} /> Restaurar demonstração
            </button>
            <button onClick={() => navigate("/")}>
              <LogOut size={13} /> Voltar ao site
            </button>
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
      {confirmReset && (
        <Modal
          title="Recomeçar a demonstração?"
          onClose={() => setConfirmReset(false)}
        >
          <p className="muted">
            Esta ação restaura o perfil de exemplo, o XP e a trilha neste
            dispositivo. As preferências de tema são mantidas. Não afeta contas
            reais.
          </p>
          <div className="reset-actions">
            <MechButton color="white" onClick={() => setConfirmReset(false)}>
              Manter progresso
            </MechButton>
            <MechButton
              color="coral"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                toast.success("Demonstração restaurada.");
              }}
            >
              Restaurar
            </MechButton>
          </div>
        </Modal>
      )}
    </>
  );
}
