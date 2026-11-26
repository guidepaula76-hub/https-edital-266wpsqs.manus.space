import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Footprints,
  LockKeyhole,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, Frog, MechButton, ProgressBar, SectionHeading, Tag } from "@/components/ultra/UI";
import { daysUntilExam, useProgress } from "@/lib/progress";
import "./journey.css";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "estudante";
}

function timeGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).format(new Date()));
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function saoPauloDay(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default function Dashboard() {
  const { state, loading, error } = useProgress();
  const [, navigate] = useLocation();
  const goal = state.goal;
  const nodes = state.nodes ?? [];
  const errors = state.errors ?? [];
  const answers = state.answers ?? [];
  const completed = nodes.filter(node => node.completed).length;
  const levelOne = nodes.filter(node => node.level === 1);
  const levelTwo = nodes.filter(node => node.level === 2);
  const completedLevelOne = levelOne.filter(node => node.completed).length;
  const completedLevelTwo = levelTwo.filter(node => node.completed).length;
  const nextNode = nodes.find(node => node.unlocked && !node.completed);
  const progressPercent = nodes.length ? Math.round((completed / nodes.length) * 100) : 0;
  const examDateIsSet = Boolean(goal?.examDate && /^\d{4}-\d{2}-\d{2}$/.test(goal.examDate));
  const untilExamValue = examDateIsSet ? daysUntilExam(goal!.examDate) : null;
  const untilExam = untilExamValue !== null && Number.isFinite(untilExamValue) ? untilExamValue : null;
  const today = saoPauloDay(new Date());
  const studiedToday = state.lastStudyDay === today;
  const judgedAnswers = answers.filter(answer => !answer.blank);
  const correctAnswers = judgedAnswers.filter(answer => answer.correct).length;
  const overallAccuracy = judgedAnswers.length ? Math.round((correctAnswers / judgedAnswers.length) * 100) : null;
  const disciplineNames = useMemo(() => {
    const fromGoal = goal?.disciplines.map(discipline => discipline.name) ?? [];
    const fromNodes = nodes.map(node => node.subject);
    return Array.from(new Set([...fromGoal, ...fromNodes]));
  }, [goal?.disciplines, nodes]);
  const accuracyRows = useMemo(() => disciplineNames.map(name => {
    const records = answers.filter(answer => (answer.subject ?? "").trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase() && !answer.blank);
    return {
      name,
      total: records.length,
      correct: records.filter(answer => answer.correct).length,
      accuracy: records.length ? Math.round((records.filter(answer => answer.correct).length / records.length) * 100) : null,
    };
  }), [answers, disciplineNames]);
  const weeklyAnswers = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const answer of answers) {
      if (!answer.createdAt) continue;
      const date = new Date(answer.createdAt);
      if (!Number.isFinite(date.getTime())) continue;
      const day = saoPauloDay(date);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = saoPauloDay(date);
      return { day: formatDay(date), count: byDay.get(key) ?? 0 };
    });
  }, [answers]);
  const allWeeklyValuesAreZero = weeklyAnswers.every(day => day.count === 0);

  return (
    <main className="journey-page dashboard-page">
      <SectionHeading
        eyebrow="Seu espaço de estudos"
        title={`${timeGreeting()}, ${firstName(state.profile.name || "estudante")}!`}
        description="Seu progresso é atualizado pelas sessões e respostas confirmadas no servidor."
      />

      {error && <Card className="dashboard-state-message" role="alert"><strong>Não foi possível atualizar o painel.</strong><span>{error}</span></Card>}

      <div className="dashboard-welcome-row">
        <Card className="dashboard-greeting-card">
          <div className="dashboard-greeting-copy">
            <Tag tone="green"><Sparkles size={13} /> Preparação em andamento</Tag>
            <h2>{goal ? "Seu próximo passo conta." : "Sua jornada começa com um objetivo."}</h2>
            <p>{goal ? "Continue avançando no seu ritmo. Nós, questões e respostas vêm da sua conta." : "Configure um concurso e um edital para criar uma trilha personalizada."}</p>
            <div className="dashboard-greeting-tags">
              <span><BookOpen size={15} /> {goal?.concurso ?? "Nenhum objetivo ativo"}</span>
              <span><Target size={15} /> {goal?.cargo ?? "Cargo não definido"}</span>
            </div>
          </div>
          <div className="dashboard-frog-wrap"><Frog pose="study" className="dashboard-frog" /></div>
        </Card>

        <div className="dashboard-stat-stack">
          <Card className="dashboard-stat-card dashboard-stat-xp">
            <div className="dashboard-stat-icon"><Zap size={19} fill="currentColor" /></div>
            <div><span>XP acumulado</span><strong>{state.xp.toLocaleString("pt-BR")}</strong><small>conta atual</small></div>
          </Card>
          <Card className="dashboard-stat-card dashboard-stat-streak">
            <div className="dashboard-stat-icon"><Flame size={20} fill="currentColor" /></div>
            <div><span>Ofensiva</span><strong>{state.streak} {state.streak === 1 ? "dia" : "dias"}</strong><small>conta atual</small></div>
          </Card>
          <Card className="dashboard-stat-card dashboard-stat-exam">
            <div className="dashboard-stat-icon"><Clock3 size={20} /></div>
            <div><span>Até a prova</span><strong>{untilExam === null ? "—" : `${untilExam} ${untilExam === 1 ? "dia" : "dias"}`}</strong><small>{examDateIsSet && goal?.examDate ? new Date(`${goal.examDate}T12:00:00`).toLocaleDateString("pt-BR") : "Data não definida"}</small></div>
          </Card>
        </div>
      </div>

      <div className="dashboard-layout-grid">
        <div className="dashboard-main-column">
          <Card className="dashboard-active-card">
            <div className="dashboard-card-heading">
              <div>
                <div className="eyebrow">Concurso ativo</div>
                <h2>{goal?.concurso ?? "Nenhum objetivo ativo"}</h2>
                <p>{goal ? `${goal.cargo} · ${goal.banca}` : "Configure sua meta para acompanhar os nós da trilha."}</p>
              </div>
              <Tag tone={goal ? "green" : "muted"}><Activity size={13} /> {goal ? "Em andamento" : "Aguardando meta"}</Tag>
            </div>
            <div className="dashboard-progress-summary">
              <div className="row-between"><strong>Trilha completa</strong><span>{completed}/{nodes.length} nós</span></div>
              <ProgressBar value={progressPercent} label="Progresso de todos os nós" />
              <div className="dashboard-progress-foot"><span>Nível 1: {completedLevelOne}/{levelOne.length} · Nível 2: {completedLevelTwo}/{levelTwo.length}</span><span>{progressPercent}%</span></div>
            </div>
            <div className="dashboard-session-cta">
              <div className="dashboard-session-icon"><Footprints size={20} /></div>
              <div className="dashboard-session-text">
                <strong>{nextNode ? "Sua próxima sessão" : goal && nodes.length && completed === nodes.length ? "Trilha concluída" : "Sua próxima etapa"}</strong>
                <span>{nextNode ? `${nextNode.subject} · ${nextNode.topic}` : goal && nodes.length && completed === nodes.length ? "Você concluiu todos os nós disponíveis." : "Crie ou atualize seu objetivo para começar."}</span>
              </div>
              <MechButton small color="green" disabled={!nextNode && !goal} onClick={() => nextNode ? navigate(`/app/questoes?node=${nextNode.id}`) : navigate(goal ? "/app/trilha" : "/onboarding")}>
                {nextNode ? "Começar" : goal ? "Ver trilha" : "Configurar"} <ArrowRight size={16} />
              </MechButton>
            </div>
          </Card>

          <Card className="dashboard-evolution-card">
            <div className="dashboard-card-heading">
              <div><div className="eyebrow">Atividade recente</div><h2>Respostas nos últimos 7 dias</h2><p>Quantidade registrada por dia, sem estimativas.</p></div>
              <span className="dashboard-chart-legend"><i /> Respostas</span>
            </div>
            {allWeeklyValuesAreZero ? (
              <div className="dashboard-empty-chart">Suas respostas confirmadas aparecerão aqui após a primeira sessão.</div>
            ) : (
              <div className="dashboard-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyAnswers} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                    <defs><linearGradient id="dashboardAnswersGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#58cc82" stopOpacity={0.27} /><stop offset="95%" stopColor="#58cc82" stopOpacity={0.02} /></linearGradient></defs>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} dy={8} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--foreground)" }} formatter={value => [`${value} respostas`, "Registradas"]} />
                    <Area type="monotone" dataKey="count" stroke="#58cc82" strokeWidth={3} fill="url(#dashboardAnswersGradient)" activeDot={{ r: 5, fill: "#58cc82", stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="dashboard-chart-caption"><TrendingUp size={15} /> Dados das respostas da sua conta.</div>
          </Card>

          <Card className="dashboard-goals-card">
            <div className="dashboard-card-heading">
              <div><div className="eyebrow">Visão da trilha</div><h2>Progresso por nível</h2></div>
              <Tag tone="purple">{nodes.length} nós</Tag>
            </div>
            <div className="dashboard-goals-grid">
              <div className="dashboard-goal-item">
                <div className="dashboard-goal-icon goal-purple"><Zap size={17} /></div>
                <div className="dashboard-goal-copy"><div><strong>Acerto geral</strong><span>{overallAccuracy === null ? "Sem respostas" : `${overallAccuracy}% · ${correctAnswers}/${judgedAnswers.length}`}</span></div><ProgressBar color="purple" value={overallAccuracy ?? 0} label="Percentual de acerto geral" /></div>
              </div>
              <div className="dashboard-goal-item">
                <div className="dashboard-goal-icon goal-green"><Footprints size={17} /></div>
                <div className="dashboard-goal-copy"><div><strong>Nível 1</strong><span>{completedLevelOne}/{levelOne.length}</span></div><ProgressBar value={levelOne.length ? (completedLevelOne / levelOne.length) * 100 : 0} label="Progresso do nível 1" /></div>
              </div>
              <div className="dashboard-goal-item">
                <div className={`dashboard-goal-icon ${studiedToday ? "goal-green" : "goal-coral"}`}>{studiedToday ? <CheckCircle2 size={17} /> : <Target size={17} />}</div>
                <div className="dashboard-goal-copy"><div><strong>Estudar hoje</strong><span>{studiedToday ? "feito" : "sem respostas hoje"}</span></div><ProgressBar color={studiedToday ? "green" : "coral"} value={studiedToday ? 100 : 0} label="Atividade de hoje" /></div>
              </div>
            </div>
          </Card>
        </div>

        <aside className="dashboard-side-column">
          <Card className="dashboard-accuracy-card">
            <div className="dashboard-card-heading dashboard-card-heading-tight">
              <div><div className="eyebrow">Visão por matéria</div><h2>Acerto por disciplina</h2></div>
              <Target className="dashboard-heading-icon" size={20} />
            </div>
            {accuracyRows.length === 0 ? (
              <div className="dashboard-empty-copy">As disciplinas aparecerão aqui quando seu objetivo estiver configurado.</div>
            ) : (
              <div className="dashboard-accuracy-list">
                {accuracyRows.map(item => <div className="dashboard-accuracy-row" key={item.name}>
                  <div className="dashboard-accuracy-label"><span>{item.name}</span><strong>{item.accuracy === null ? "—" : `${item.accuracy}%`}</strong></div>
                  {item.accuracy === null ? <small className="dashboard-no-answers">Nenhuma resposta avaliada</small> : <ProgressBar value={item.accuracy} color={item.accuracy < 65 ? "coral" : item.accuracy < 75 ? "purple" : "green"} label={`Acerto em ${item.name}`} />}
                </div>)}
              </div>
            )}
            <div className="dashboard-inline-note"><Sparkles size={14} /> {answers.length} respostas registradas; respostas em branco não entram no percentual de acerto.</div>
          </Card>

          <Card className="dashboard-xray-card">
            <div className="dashboard-card-heading dashboard-card-heading-tight">
              <div><div className="eyebrow">Raio-X</div><h2>Pontos para revisar</h2></div>
              <span className="dashboard-xray-mark"><Activity size={18} /></span>
            </div>
            <p className="dashboard-xray-intro">Caderno real de respostas incorretas pendentes.</p>
            {errors.length ? (
              <div className="dashboard-weak-list">
                {errors.slice(0, 4).map(entry => <div className="dashboard-weak-item" key={entry.questionId}>
                  <span className="dashboard-weak-dot" />
                  <div className="dashboard-weak-copy"><strong>{entry.prompt}</strong><span>{entry.subject} · {entry.topic} · {entry.errorCount} {entry.errorCount === 1 ? "erro" : "erros"}</span></div>
                  <button className="dashboard-weak-open" aria-label={`Abrir revisão: ${entry.topic}`} onClick={() => navigate(`/app/questoes?error=${entry.questionId}`)}><ArrowRight size={16} /></button>
                </div>)}
                <MechButton color="purple" small className="dashboard-xray-cta" onClick={() => navigate(`/app/questoes?error=${errors[0].questionId}`)}>Revisar questão <ArrowRight size={16} /></MechButton>
              </div>
            ) : (
              <div className="dashboard-empty-copy">Nenhuma questão pendente no caderno de erros.</div>
            )}
            <div className="dashboard-inline-note"><LockKeyhole size={13} /> Questões listadas pertencem à sua conta.</div>
          </Card>

          <Card className="dashboard-streak-card">
            <div className="dashboard-streak-art"><div className="dashboard-streak-orbit orbit-one" /><div className="dashboard-streak-orbit orbit-two" /><Flame size={25} fill="currentColor" /></div>
            <div><Tag tone="coral">Constância</Tag><h3>{state.streak ? "Seu ritmo está em andamento" : "Comece no seu ritmo"}</h3><p>{state.streak ? `${state.streak} dias de dedicação registrados.` : "Uma sessão curta já pode iniciar sua sequência."}</p></div>
            <Trophy className="dashboard-streak-trophy" size={22} />
          </Card>
        </aside>
      </div>
      {loading && <p className="dashboard-loading-note" aria-live="polite">Atualizando dados da sua conta…</p>}
    </main>
  );
}
