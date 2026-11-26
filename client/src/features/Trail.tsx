import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  LockKeyhole,
  Medal,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { Card, Frog, MechButton, SectionHeading, Tag } from "@/components/ultra/UI";
import { useProgress } from "@/lib/progress";
import "./journey.css";

const NODE_GAP = 142;
const NODE_TOP = 76;

function buildTrailPath(count: number) {
  if (!count) return "";
  const points = Array.from({ length: count }, (_, index) => ({
    x: index % 2 === 0 ? 66 : 34,
    y: NODE_TOP + index * NODE_GAP,
  }));
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.y + point.y) / 2;
    return `${path} C ${previous.x} ${middle}, ${point.x} ${middle}, ${point.x} ${point.y}`;
  }, "");
}

export default function Trail() {
  const { state, loading, error } = useProgress();
  const [, navigate] = useLocation();
  const nodes = useMemo(
    () => [...(state.nodes ?? [])].sort((a, b) => a.level - b.level || a.position - b.position),
    [state.nodes]
  );
  const errors = state.errors ?? [];
  const completedCount = nodes.filter(node => node.completed).length;
  const unlockedCount = nodes.filter(node => node.unlocked).length;
  const nextNode = nodes.find(node => node.unlocked && !node.completed);
  const pathHeight = nodes.length ? NODE_TOP * 2 + (nodes.length - 1) * NODE_GAP : 0;
  const path = buildTrailPath(nodes.length);
  const levelOne = nodes.filter(node => node.level === 1);
  const levelTwo = nodes.filter(node => node.level === 2);

  return (
    <main className="journey-page trail-page">
      <SectionHeading
        eyebrow="Seu caminho de aprendizagem"
        title="Trilha de estudos"
        description={state.goal
          ? `Uma trilha criada para ${state.goal.concurso} · ${state.goal.cargo}. Avance no seu ritmo, nó por nó.`
          : "Sua trilha personalizada aparecerá aqui quando seu objetivo estiver configurado."}
        action={
          <MechButton color="white" small onClick={() => navigate("/app/conteudos?tab=guia")}>
            <BookOpen size={16} /> Guia do edital <span className="trail-demo-label">· amostra</span>
          </MechButton>
        }
      />

      {error && (
        <Card className="trail-state-message" role="alert">
          <strong>Não foi possível atualizar sua trilha.</strong>
          <span>{error}</span>
        </Card>
      )}

      <div className="trail-overview-grid">
        <Card className="trail-overview-card">
          <div className="trail-overview-icon"><Star size={20} fill="currentColor" /></div>
          <div>
            <span>Nós concluídos</span>
            <strong>{completedCount} de {nodes.length}</strong>
            <small>{unlockedCount} liberados pelo seu progresso</small>
          </div>
        </Card>
        <Card className="trail-overview-card trail-overview-highlight">
          <div className="trail-overview-icon"><Trophy size={20} /></div>
          <div>
            <span>Próxima missão</span>
            <strong>{nextNode ? nextNode.topic : nodes.length && completedCount === nodes.length ? "Trilha concluída" : "Aguardando seu edital"}</strong>
            <small>{nextNode ? `${nextNode.subject} · Nível ${nextNode.level}` : "As etapas são liberadas pelo servidor"}</small>
          </div>
        </Card>
        <Card className="trail-overview-card">
          <div className="trail-overview-icon"><Sparkles size={20} /></div>
          <div>
            <span>Seu progresso</span>
            <strong>{state.xp.toLocaleString("pt-BR")} XP</strong>
            <small>{state.streak} {state.streak === 1 ? "dia" : "dias"} de sequência</small>
          </div>
        </Card>
      </div>

      <Card className="trail-path-card">
        <div className="trail-unit-heading">
          <div className="trail-unit-title">
            <Tag tone="green">TRILHA PERSONALIZADA</Tag>
            <h2>{state.goal?.concurso ?? "Seu edital"}</h2>
            <p>
              {state.goal
                ? `${state.goal.disciplines.length} disciplinas · ${nodes.length} nós entre fundamentos e aprofundamento.`
                : "Configure uma meta para gerar seus nós de estudo."}
            </p>
          </div>
          <Frog pose="cheer" className="trail-unit-frog" decorative />
          <MechButton color="purple" small onClick={() => navigate("/app/conteudos?tab=guia")}>
            <BookOpen size={16} /> Guia · amostra
          </MechButton>
        </div>

        <div className="trail-unit-progress">
          <div>
            <span>Progresso da trilha</span>
            <strong>{completedCount}/{nodes.length}</strong>
          </div>
          <div className="trail-progress-track" role="progressbar" aria-label="Progresso da trilha" aria-valuemin={0} aria-valuemax={nodes.length || 1} aria-valuenow={completedCount}>
            <span style={{ width: `${nodes.length ? (completedCount / nodes.length) * 100 : 0}%` }} />
          </div>
        </div>

        {loading && nodes.length === 0 ? (
          <div className="trail-empty-state" aria-live="polite">Carregando seus nós de estudo…</div>
        ) : nodes.length === 0 ? (
          <div className="trail-empty-state">
            <LockKeyhole size={22} />
            <div>
              <strong>Nenhum nó disponível ainda</strong>
              <p>{state.goal ? "Sua trilha será exibida assim que os nós forem carregados." : "Finalize a configuração do objetivo para montar uma trilha baseada no seu edital."}</p>
            </div>
            {!state.goal && <MechButton small color="purple" onClick={() => navigate("/onboarding")}>Configurar objetivo <ArrowRight size={15} /></MechButton>}
          </div>
        ) : (
          <div
            className="trail-map trail-map-dynamic"
            style={{ height: `${pathHeight}px` }}
            aria-label="Trilha sinuosa personalizada com níveis 1 e 2"
          >
            <svg className="trail-route-svg" viewBox={`0 0 100 ${pathHeight}`} preserveAspectRatio="none" aria-hidden="true">
              <path d={path} />
            </svg>
            {nodes.map((node, index) => {
              const complete = node.completed;
              const active = !complete && node.unlocked;
              const locked = !complete && !node.unlocked;
              const x = index % 2 === 0 ? 66 : 34;
              const side = x < 50 ? "copy-right" : "copy-left";
              const y = NODE_TOP + index * NODE_GAP;
              return (
                <div
                  className={`trail-map-stop ${complete ? "is-complete" : active ? "is-active" : "is-locked"}`}
                  key={node.id}
                  style={{ left: 0, top: `${(y / pathHeight) * 100}%`, ["--node-x" as string]: `${x}%` }}
                >
                  <MechButton
                    color={complete ? "green" : active ? (node.level === 1 ? "green" : "purple") : "white"}
                    className={`trail-node-button ${active ? "trail-node-pulse" : ""} ${complete ? "trail-node-done" : ""}`}
                    disabled={locked}
                    onClick={() => navigate(`/app/questoes?node=${node.id}`)}
                    aria-label={`${complete ? "Refazer" : locked ? "Bloqueado" : "Começar"}: ${node.topic}, nível ${node.level}`}
                    title={locked ? "Este nó ainda não foi liberado" : `${complete ? "Refazer" : "Começar"} ${node.topic}`}
                  >
                    {complete ? <Check size={25} strokeWidth={3} /> : locked ? <LockKeyhole size={19} /> : <span>{String(node.position).padStart(2, "0")}</span>}
                  </MechButton>
                  <div className={`trail-node-copy ${side}`}>
                    <span className="trail-node-kicker">
                      {complete ? "CONCLUÍDO" : active ? "MISSÃO LIBERADA" : "BLOQUEADO PELO SERVIDOR"} · N{node.level}
                    </span>
                    <strong>{node.topic}</strong>
                    <span className="trail-node-description">{node.subject} · {node.questionCount} {node.questionCount === 1 ? "questão salva" : "questões salvas"}</span>
                    {(complete || active) && <span className="trail-refaz">{complete ? "Refazer sessão" : "Abrir sessão"} <ChevronRight size={12} /></span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {levelOne.length > 0 && levelOne.every(node => node.completed) && levelTwo.length > 0 && (
          <div className="trail-level-unlocked">
            <div className="trail-unlocked-medal"><Medal size={21} /></div>
            <div>
              <strong>Nível 2 concluído ou liberado conforme a trilha</strong>
              <span>Os estados dos nós são fornecidos pelo servidor; continue pela próxima etapa disponível.</span>
            </div>
            <Tag tone="green">{levelTwo.filter(node => node.unlocked).length}/{levelTwo.length} liberados</Tag>
          </div>
        )}
      </Card>

      <Card className="trail-guide-note">
        <div><BookOpen size={17} /><strong>Guia do edital — amostra demonstrativa</strong></div>
        <p>O guia em Conteúdos é uma amostra visual e não substitui a verticalização do seu edital nem confirma a legislação vigente.</p>
        <MechButton color="white" small onClick={() => navigate("/app/conteudos?tab=guia")}>Abrir guia <ArrowRight size={15} /></MechButton>
      </Card>

      <Card className="trail-errors-card">
        <div className="trail-errors-heading">
          <div>
            <div className="eyebrow">REVISÃO PERSISTENTE</div>
            <h2>Caderno de erros da trilha</h2>
            <p>Questões registradas pelo servidor nas suas tentativas.</p>
          </div>
          <Tag tone="coral">{errors.length} {errors.length === 1 ? "questão" : "questões"}</Tag>
        </div>
        {errors.length ? (
          <div className="trail-error-list">
            {errors.map((entry, index) => (
              <div className="trail-error-row" key={entry.questionId}>
                <span className="error-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{entry.prompt}</strong>
                  <small>{entry.subject} · {entry.topic} · {entry.errorCount} {entry.errorCount === 1 ? "erro" : "erros"}</small>
                </div>
                <MechButton color="white" small onClick={() => navigate(`/app/questoes?error=${entry.questionId}`)}>
                  Revisar <ArrowRight size={14} />
                </MechButton>
              </div>
            ))}
          </div>
        ) : (
          <p className="trail-errors-empty">Ainda não há questões pendentes de revisão. Respostas incorretas não em branco aparecerão aqui.</p>
        )}
      </Card>

      <div className="trail-footer-note">
        <LockKeyhole size={14} />
        <span>Os nós bloqueados só podem ser abertos quando o servidor os liberar. Sessões concluídas podem ser refeitas sem alterar o gabarito no cliente.</span>
      </div>
    </main>
  );
}
