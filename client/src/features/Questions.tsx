import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, ArrowRight, Check, ListFilter, Sparkles } from "lucide-react";
import { Card, DemoNote, MechButton, SectionHeading, Tag } from "@/components/ultra/UI";
import { useProgress } from "@/lib/progress";
import { api } from "@/lib/api";
import type { AnswerFeedback, NodeQuestionsResponse, StudyQuestion } from "@shared/ultra";
import "./questions.css";

function NodeStudySession({ nodeId }: { nodeId: number }) {
  const { refresh } = useProgress();
  const [data, setData] = useState<NodeQuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const pendingRequestId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<NodeQuestionsResponse>(`/api/study/nodes/${nodeId}/questions`);
      setData(result);
      setIndex(0);
      setSelected(null);
      setFeedback(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar este tópico.");
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => { void load(); }, [load]);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await api<NodeQuestionsResponse & { notice?: string }>(
        `/api/study/nodes/${nodeId}/generate`, { method: "POST", body: {} }
      );
      setData(result);
      setNotice(result.notice ?? "Questões geradas por IA. Confira a legislação e o edital vigentes.");
      setIndex(0);
      setSelected(null);
      setFeedback(null);
      await refresh().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível gerar as questões.");
    } finally {
      setGenerating(false);
    }
  };

  const question: StudyQuestion | undefined = data?.questions[index];
  const submit = async (value: string | null) => {
    if (!question || saving || feedback) return;
    if (value === null && question.format !== "CE") return;
    pendingRequestId.current ??= crypto.randomUUID();
    setSaving(true);
    setError(null);
    try {
      const result = await api<AnswerFeedback>("/api/study/answers", {
        method: "POST",
        body: { questionId: question.id, value, requestId: pendingRequestId.current },
      });
      pendingRequestId.current = null;
      setFeedback(result);
      setSelected(value);
      await refresh().catch(() => {});
    } catch (e) {
      // Mantém o mesmo requestId para que uma repetição não duplique a tentativa.
      setError(e instanceof Error ? e.message : "Não foi possível registrar sua resposta.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    setIndex(i => Math.min((data?.questions.length ?? 1) - 1, i + 1));
    setSelected(null);
    setFeedback(null);
    pendingRequestId.current = null;
  };

  if (loading) return <main className="question-page"><SectionHeading eyebrow="TRILHA PERSONALIZADA" title="Carregando questões…" description="Buscando as questões deste tópico no seu progresso salvo." /></main>;
  if (!data) return (
    <main className="question-page">
      <SectionHeading eyebrow="TRILHA PERSONALIZADA" title="Não foi possível abrir este tópico" description={error ?? "Tente novamente."} />
      <MechButton color="white" onClick={() => void load()}>Tentar novamente</MechButton>
    </main>
  );

  if (!data.questions.length) return (
    <main className="question-page">
      <div className="question-page-topline"><MechButton color="white" small onClick={() => history.back()}><ArrowLeft size={15} /> Voltar à trilha</MechButton><Tag tone="green">Nível {data.node.level}</Tag></div>
      <SectionHeading eyebrow={data.node.subject} title={data.node.topic} description="Este tópico ainda não possui questões salvas. Gere uma sessão de três questões para começar." />
      {error && <Card role="alert">{error}</Card>}
      <MechButton color="purple" disabled={generating} onClick={() => void generate()}>{generating ? "Gerando questões…" : <><Sparkles size={16} /> Gerar 3 questões com IA</>}</MechButton>
      <DemoNote>Questões inéditas geradas por IA; não são questões oficiais. Confira a legislação e o edital vigentes.</DemoNote>
    </main>
  );

  return (
    <main className="question-page">
      <div className="question-page-topline"><MechButton color="white" small onClick={() => history.back()}><ArrowLeft size={15} /> Voltar à trilha</MechButton><Tag tone="green">Nível {data.node.level}</Tag></div>
      <SectionHeading eyebrow={data.node.subject} title={data.node.topic} description={`Questão ${index + 1} de ${data.questions.length}. O gabarito só é revelado depois que você responde.`} />
      {notice && <DemoNote>{notice}</DemoNote>}
      {error && <Card role="alert">{error}</Card>}
      <Card className="question-card">
        <div className="question-card-meta"><div className="question-tags"><Tag tone="purple">{question?.board}</Tag><Tag tone="muted">{question?.difficulty}</Tag></div><span>{question?.format === "CE" ? "Certo / Errado" : question?.format === "AD" ? "Alternativas A–D" : "Alternativas A–E"}</span></div>
        <p className="question-prompt">{question?.prompt}</p>
        <div className={`question-choices ${question?.format === "CE" ? "question-choices-binary" : ""}`} role="group" aria-label="Alternativas">
          {question?.choices.map(choice => (
            <MechButton key={choice.value} type="button" color={selected === choice.value ? "purple" : "white"} disabled={Boolean(feedback) || saving} onClick={() => setSelected(choice.value)}>
              <span className="choice-mark">{choice.value}</span><span className="choice-copy">{choice.text}</span>
            </MechButton>
          ))}
        </div>
        {!feedback && <div className="question-submit-row">
          <span className="question-submit-hint">{question?.format === "CE" ? "Marque Certo ou Errado, ou deixe em branco." : "Selecione uma alternativa para confirmar."}</span>
          <div className="question-submit-actions">
            {question?.format === "CE" && <MechButton color="white" small disabled={saving} onClick={() => void submit(null)}>Deixar em branco</MechButton>}
            <MechButton color="green" disabled={!selected || saving} onClick={() => selected && void submit(selected)}>{saving ? "Registrando…" : "Confirmar resposta"}</MechButton>
          </div>
        </div>}
      </Card>
      {feedback && <Card className={`question-feedback ${feedback.correct ? "feedback-correct" : "feedback-support"}`}>
        <div className="feedback-content">
          <div className="feedback-title-row"><h3>{feedback.correct ? "Resposta certa!" : feedback.blank ? "Questão em branco" : "Vamos revisar esta questão"}</h3><Tag tone={feedback.correct ? "green" : "coral"}>{feedback.correct ? "Acertou" : `Gabarito: ${feedback.correctAnswer}`}</Tag></div>
          <p className="feedback-explanation">{feedback.explanation}</p>
          <div className="answer-justifications"><h4>Justificativa das alternativas</h4>{feedback.rationales.map(item => <div className="answer-justification" key={item.value}><strong>{item.value} · {item.text}</strong><p>{item.rationale}</p></div>)}</div>
          <div className="trap-callout"><span className="trap-label"><Sparkles size={13} /> Pegadinha</span><p>{feedback.trap}</p></div>
          <p><strong>XP recebido:</strong> {feedback.xpAwarded}</p>
          {feedback.nodeCompleted && <Tag tone="green">Tópico concluído e próxima etapa liberada</Tag>}
        </div>
      </Card>}
      <div className="session-advance-row">
        <span>{Object.keys(data.questions).length} questões nesta sessão · {index + 1} de {data.questions.length}</span>
        {feedback && <MechButton color="purple" onClick={() => index < data.questions.length - 1 ? next() : history.back()}>{index < data.questions.length - 1 ? <>Próxima questão <ArrowRight size={15} /></> : <>Voltar à trilha <ArrowRight size={15} /></>}</MechButton>}
      </div>
      <DemoNote>Questões geradas por IA, não oficiais. O desempenho e o caderno de erros são registrados na sua conta.</DemoNote>
    </main>
  );
}


function ErrorReviewSession({ questionId }: { questionId: number }) {
  const { refresh } = useProgress();
  const [, navigate] = useLocation();
  const [question, setQuestion] = useState<StudyQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<StudyQuestion>(`/api/study/questions/${questionId}`);
      setQuestion(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar esta questão do caderno.");
    } finally {
      setLoading(false);
    }
  }, [questionId]);
  useEffect(() => { void load(); }, [load]);

  const submit = async (value: string | null) => {
    if (!question || saving || feedback) return;
    if (value === null && question.format !== "CE") return;
    requestId.current ??= crypto.randomUUID();
    setSaving(true);
    setError(null);
    try {
      const result = await api<AnswerFeedback>("/api/study/answers", {
        method: "POST",
        body: { questionId: question.id, value, requestId: requestId.current },
      });
      requestId.current = null;
      setSelected(value);
      setFeedback(result);
      await refresh().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível registrar a revisão.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="question-page"><SectionHeading eyebrow="CADERNO DE ERROS" title="Carregando revisão…" description="Buscando a questão salva na sua conta." /></main>;
  if (!question) return <main className="question-page"><SectionHeading eyebrow="CADERNO DE ERROS" title="Questão indisponível" description={error ?? "Esta questão não está mais disponível."} /><MechButton color="white" onClick={() => navigate("/app/perfil")}>Voltar ao perfil</MechButton></main>;

  return (
    <main className="question-page">
      <div className="question-page-topline"><MechButton color="white" small onClick={() => navigate("/app/perfil")}><ArrowLeft size={15} /> Voltar</MechButton><Tag tone="coral">Revisão de erro</Tag></div>
      <SectionHeading eyebrow={question.subject} title={question.topic} description="Responda novamente. O gabarito e os comentários só aparecem depois do envio." />
      {error && <Card role="alert">{error}</Card>}
      <Card className="question-card">
        <div className="question-card-meta"><div className="question-tags"><Tag tone="purple">{question.board}</Tag><Tag tone="muted">{question.difficulty}</Tag></div><span>{question.format === "CE" ? "Certo / Errado" : question.format === "AD" ? "Alternativas A–D" : "Alternativas A–E"}</span></div>
        <p className="question-prompt">{question.prompt}</p>
        <div className={`question-choices ${question.format === "CE" ? "question-choices-binary" : ""}`} role="group" aria-label="Alternativas">
          {question.choices.map(choice => <MechButton key={choice.value} type="button" color={selected === choice.value ? "purple" : "white"} disabled={Boolean(feedback) || saving} onClick={() => setSelected(choice.value)}><span className="choice-mark">{choice.value}</span><span className="choice-copy">{choice.text}</span></MechButton>)}
        </div>
        {!feedback && <div className="question-submit-row"><span className="question-submit-hint">{question.format === "CE" ? "Você também pode deixar em branco." : "Selecione uma alternativa."}</span><div className="question-submit-actions">{question.format === "CE" && <MechButton color="white" small disabled={saving} onClick={() => void submit(null)}>Deixar em branco</MechButton>}<MechButton color="green" disabled={!selected || saving} onClick={() => selected && void submit(selected)}>{saving ? "Registrando…" : "Confirmar revisão"}</MechButton></div></div>}
      </Card>
      {feedback && <Card className={`question-feedback ${feedback.correct ? "feedback-correct" : "feedback-support"}`}><div className="feedback-content"><div className="feedback-title-row"><h3>{feedback.correct ? "Você acertou na revisão!" : feedback.blank ? "Resposta em branco" : "Ainda precisa revisar"}</h3><Tag tone={feedback.correct ? "green" : "coral"}>{feedback.correct ? "Acertou" : `Gabarito: ${feedback.correctAnswer}`}</Tag></div><p className="feedback-explanation">{feedback.explanation}</p><div className="answer-justifications"><h4>Justificativa das alternativas</h4>{feedback.rationales.map(item => <div className="answer-justification" key={item.value}><strong>{item.value} · {item.text}</strong><p>{item.rationale}</p></div>)}</div><div className="trap-callout"><span className="trap-label"><Sparkles size={13} /> Pegadinha</span><p>{feedback.trap}</p></div><p><strong>XP recebido:</strong> {feedback.xpAwarded}</p><p>{feedback.correct ? "Este erro foi marcado como resolvido no seu caderno." : "A questão continua no caderno para uma próxima revisão."}</p></div></Card>}
      <DemoNote>Esta revisão consulta o histórico da sua conta e registra a nova tentativa no servidor.</DemoNote>
    </main>
  );
}

export default function Questions() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const nodeId = query.get("node");
  const errorId = query.get("error");

  if (errorId && /^\d+$/.test(errorId)) {
    return <ErrorReviewSession questionId={Number(errorId)} />;
  }
  if (nodeId && /^\d+$/.test(nodeId)) {
    return <NodeStudySession nodeId={Number(nodeId)} />;
  }

  if (query.has("mode") || query.has("lesson")) {
    return (
      <main className="question-page">
        <SectionHeading
          eyebrow="QUESTÕES E SIMULADOS"
          title="Este modo ainda está em integração"
          description="Os antigos módulos usavam questões fictícias. Eles foram desativados para não misturar demonstrações com seu histórico real."
        />
        <Card>
          <Tag tone="muted">Banco livre e simulados em desenvolvimento</Tag>
          <p>As questões da sua trilha e as revisões do caderno já usam sua conta. Os simulados completos serão ativados quando o banco real e o salvamento das provas estiverem prontos.</p>
          <MechButton color="green" onClick={() => navigate("/app/trilha")}>Abrir minha trilha <ArrowRight size={16} /></MechButton>
        </Card>
      </main>
    );
  }

  return (
    <main className="question-page questions-home-page">
      <SectionHeading
        eyebrow="SEU ESPAÇO DE ESTUDOS"
        title="Questões e simulados"
        description="Acesse as questões geradas para os tópicos da sua trilha e revise os erros registrados na sua conta."
      />
      <div className="question-overview-grid">
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-purple"><ListFilter size={17} /></div>
          <div><strong>Trilha</strong><span>questões por tópico</span></div>
        </Card>
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-green"><Check size={17} /></div>
          <div><strong>Histórico</strong><span>respostas da sua conta</span></div>
        </Card>
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-coral"><Sparkles size={17} /></div>
          <div><strong>Revisão</strong><span>caderno de erros</span></div>
        </Card>
      </div>
      <Card>
        <Tag tone="green">Disponível</Tag>
        <h2>Questões da sua trilha</h2>
        <p>Abra uma etapa liberada. Se ela ainda não tiver questões, você poderá gerar uma sessão de três questões com IA.</p>
        <MechButton color="green" onClick={() => navigate("/app/trilha")}>Ir para a trilha <ArrowRight size={16} /></MechButton>
      </Card>
      <Card>
        <Tag tone="muted">Em desenvolvimento</Tag>
        <h2>Banco livre e simulados completos</h2>
        <p>As antigas questões de demonstração não são usadas para calcular seu XP, seu desempenho ou sua conclusão de etapas.</p>
      </Card>
    </main>
  );
}
