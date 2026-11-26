import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Flag,
  GraduationCap,
  ListFilter,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import {
  Card,
  DemoNote,
  Frog,
  MechButton,
  Modal,
  ProgressBar,
  SectionHeading,
  Tag,
} from "@/components/ultra/UI";
import { useProgress } from "@/lib/progress";
import { api } from "@/lib/api";
import type { AnswerFeedback, NodeQuestionsResponse, StudyQuestion } from "@shared/ultra";
import {
  BOARD_NAMES,
  DEMO_QUESTIONS,
  FORMAT_NAMES,
  LESSON_TITLES,
  formatForBoard,
  getCorrectAnswer,
  getLessonQuestions,
  getQuestionById,
  getQuestionChoices,
  getQuestionRationales,
  type DemoQuestion,
  type ExamFormat,
} from "@/lib/questions";
import "./questions.css";

type AnswerResult = { value: string | null; correct: boolean; blank: boolean };
type SessionResults = Record<string, AnswerResult>;
type SimulationRow = { question: DemoQuestion; result: AnswerResult };
type FormatOverride = "auto" | ExamFormat;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

function FormatPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
}: {
  value: FormatOverride;
  onChange: (value: FormatOverride) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={`question-control ${compact ? "question-control-compact" : ""}`}
    >
      <span>Formato de resposta</span>
      <select
        aria-label="Formato de resposta"
        disabled={disabled}
        value={value}
        onChange={event => onChange(event.target.value as FormatOverride)}
      >
        <option value="auto">Automático pela banca</option>
        <option value="CE">Certo / Errado</option>
        <option value="AD">Múltipla escolha · A–D</option>
        <option value="AE">Múltipla escolha · A–E</option>
      </select>
    </label>
  );
}

function QuestionFeedback({
  question,
  result,
  format,
}: {
  question: DemoQuestion;
  result: AnswerResult;
  format: ExamFormat;
}) {
  const correctAnswer = getCorrectAnswer(question, format);
  return (
    <Card
      className={`question-feedback ${result.correct ? "feedback-correct" : "feedback-support"}`}
    >
      <div className="feedback-mascot">
        <Frog pose={result.correct ? "cheer" : "support"} />
      </div>
      <div className="feedback-content">
        <div className="feedback-title-row">
          <div>
            <div
              className={`feedback-kicker ${result.correct ? "feedback-kicker-correct" : ""}`}
            >
              {result.correct ? <Check size={15} /> : <Sparkles size={15} />}
              {result.correct
                ? "Resposta certa"
                : result.blank
                  ? "Resposta em branco"
                  : "Boa tentativa — vamos aprender"}
            </div>
            <h3>
              {result.correct
                ? "Mandou bem!"
                : result.blank
                  ? "Agora você já sabe"
                  : "Essa era uma pegadinha clássica"}
            </h3>
          </div>
          <Tag tone={result.correct ? "green" : "coral"}>
            {result.correct ? "Acertou" : `Gabarito: ${correctAnswer}`}
          </Tag>
        </div>
        <p className="feedback-explanation">{question.explanation}</p>
        <section
          className="answer-justifications"
          aria-label="Justificativa de cada item"
        >
          <div className="answer-justifications-heading">
            <h4>Justificativa item por item</h4>
            <span>
              {format === "CE"
                ? "Certo / Errado"
                : `Alternativas A–${format === "AD" ? "D" : "E"}`}
            </span>
          </div>
          <div className="answer-justifications-list">
            {getQuestionRationales(question, format).map(item => (
              <div
                className={`answer-justification ${item.correct ? "justification-correct" : "justification-incorrect"}`}
                key={item.value}
              >
                <div className="justification-leading">
                  <span className="justification-letter">{item.label}</span>
                  <Tag tone={item.correct ? "green" : "muted"}>
                    {item.correct ? "Gabarito" : "Item"}
                  </Tag>
                </div>
                <div className="justification-copy">
                  <strong>{item.text}</strong>
                  <p>{item.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="trap-callout">
          <span className="trap-label">
            <Sparkles size={13} /> Pegadinha da banca
          </span>
          <p>{question.trap}</p>
        </div>
        <DemoNote>
          Comentário demonstrativo, preparado para esta amostra. Não foi gerado
          por IA.
        </DemoNote>
      </div>
    </Card>
  );
}

function QuestionRunner({
  question,
  format,
  selectedValue,
  result,
  onSelect,
  onSubmit,
  showQuestionTimer = true,
  allowBlank,
}: {
  question: DemoQuestion;
  format: ExamFormat;
  selectedValue: string | null;
  result: AnswerResult | null;
  onSelect: (value: string) => void;
  onSubmit: (value: string | null) => void;
  showQuestionTimer?: boolean;
  allowBlank?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(0);
    if (!showQuestionTimer || result) return;
    const timer = window.setInterval(
      () => setElapsed(seconds => seconds + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, [question.id, showQuestionTimer, result]);

  const choices = getQuestionChoices(question, format);
  const correctValue = getCorrectAnswer(question, format);
  const canLeaveBlank = allowBlank ?? format === "CE";
  return (
    <div className="question-runner">
      <Card className="question-card">
        <div className="question-card-meta">
          <div className="question-tags">
            <Tag tone="purple">{question.subject}</Tag>
            <Tag tone="muted">{question.topic}</Tag>
          </div>
          {showQuestionTimer && !result && (
            <div className="question-clock">
              <Clock3 size={14} />
              <span>{formatTime(elapsed)}</span>
              <small>nesta questão</small>
            </div>
          )}
        </div>
        <p className="question-prompt">{question.prompt}</p>
        <div
          className={`question-choices ${format === "CE" ? "question-choices-binary" : ""}`}
          role="group"
          aria-label="Alternativas"
        >
          {choices.map(choice => {
            const isSelected =
              (result?.value ?? selectedValue) === choice.value;
            const isAnswer = Boolean(result && correctValue === choice.value);
            const isWrongSelection = Boolean(
              result && isSelected && !result.correct
            );
            const color = result
              ? isAnswer
                ? "green"
                : isWrongSelection
                  ? "coral"
                  : "white"
              : isSelected
                ? "purple"
                : "white";
            return (
              <MechButton
                key={choice.value}
                type="button"
                color={color}
                className={`question-choice ${isSelected ? "choice-selected" : ""} ${isAnswer ? "choice-answer" : ""} ${isWrongSelection ? "choice-missed" : ""}`}
                aria-pressed={isSelected}
                disabled={Boolean(result)}
                onClick={() => onSelect(choice.value)}
              >
                <span className="choice-mark">{choice.label}</span>
                <span className="choice-copy">{choice.text}</span>
              </MechButton>
            );
          })}
        </div>
        {!result && (
          <div className="question-submit-row">
            <span className="question-submit-hint">
              {canLeaveBlank
                ? format === "CE"
                  ? "Marque Certo ou Errado; você também pode deixar em branco."
                  : "Selecione uma alternativa ou deixe a questão em branco."
                : format === "CE"
                  ? "Marque Certo ou Errado para conferir o gabarito."
                  : "Selecione uma alternativa para confirmar sua resposta."}
            </span>
            <div className="question-submit-actions">
              {canLeaveBlank && (
                <MechButton
                  type="button"
                  color="white"
                  small
                  onClick={() => onSubmit(null)}
                >
                  Deixar em branco
                </MechButton>
              )}
              <MechButton
                type="button"
                color="green"
                disabled={!selectedValue}
                onClick={() => selectedValue && onSubmit(selectedValue)}
              >
                Confirmar resposta
              </MechButton>
            </div>
          </div>
        )}
      </Card>
      {result && (
        <QuestionFeedback question={question} result={result} format={format} />
      )}
    </div>
  );
}

function FormatHint({ format, board }: { format: ExamFormat; board: string }) {
  return (
    <div className="format-hint">
      <ShieldCheck size={14} />
      <span>
        {board || "Banca selecionada"} · {FORMAT_NAMES[format]}
      </span>
    </div>
  );
}


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
  const { state, recordAnswer, completeLesson } = useProgress();
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const lessonParam = query.get("lesson");
  const lessonIndex =
    lessonParam !== null && /^\d+$/.test(lessonParam)
      ? Number(lessonParam)
      : null;
  const lessonLevel: 1 | 2 = query.get("level") === "2" ? 2 : 1;
  const errorId = query.get("error");
  const isErrorMode = errorId !== null;
  const isSimulation = query.get("mode") === "simulado";
  const nodeParam = query.get("node");
  const levelTwoUnlocked = Array.from(
    { length: 6 },
    (_, index) => `l1-${index}`
  ).every(id => state.completedNodes.includes(id));
  const simulationQuestions = useMemo(() => {
    const available = DEMO_QUESTIONS.filter(
      question => question.level === 1 || levelTwoUnlocked
    );
    const firstByTopic = new Map<string, DemoQuestion>();
    for (const question of available)
      if (!firstByTopic.has(question.subject))
        firstByTopic.set(question.subject, question);
    const selected = [...firstByTopic.values()];
    for (const question of available)
      if (
        selected.length < 10 &&
        !selected.some(item => item.id === question.id)
      )
        selected.push(question);
    return selected.slice(0, 10);
  }, [levelTwoUnlocked]);
  const trackQuestions = useMemo(
    () =>
      lessonIndex !== null && lessonIndex >= 0 && lessonIndex < 6
        ? getLessonQuestions(lessonLevel, lessonIndex)
        : [],
    [lessonIndex, lessonLevel]
  );
  const errorQuestion = errorId ? getQuestionById(errorId) : undefined;

  const [selectedBoard, setSelectedBoard] = useState(
    BOARD_NAMES.includes(state.profile.banca) ? state.profile.banca : ""
  );
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [formatOverride, setFormatOverride] = useState<FormatOverride>("auto");
  const [practiceQuestionId, setPracticeQuestionId] = useState<string | null>(
    null
  );
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [practiceResult, setPracticeResult] = useState<AnswerResult | null>(
    null
  );
  const [trackIndex, setTrackIndex] = useState(0);
  const [trackResults, setTrackResults] = useState<SessionResults>({});
  const [trackFinished, setTrackFinished] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [simulationResponses, setSimulationResponses] = useState<
    Record<string, string | null>
  >({});
  const [simulationResults, setSimulationResults] = useState<
    SimulationRow[] | null
  >(null);
  const [simulationRemaining, setSimulationRemaining] = useState(20 * 60);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const finalizedSimulation = useRef(false);

  const effectiveFormat =
    formatOverride === "auto"
      ? selectedBoard && selectedBoard !== state.profile.banca
        ? formatForBoard(selectedBoard)
        : state.profile.format
      : formatOverride;
  const changeFormat = (format: FormatOverride) => {
    setFormatOverride(format);
    setSelectedValue(null);
  };
  const activePracticeQuestion = isErrorMode
    ? errorQuestion
    : practiceQuestionId
      ? getQuestionById(practiceQuestionId)
      : undefined;
  const currentTrackQuestion = trackQuestions[trackIndex];
  const currentSimulationQuestion = simulationQuestions[simulationIndex];
  const activeQuestionKey = isSimulation
    ? `simulation:${currentSimulationQuestion?.id ?? ""}`
    : lessonIndex !== null
      ? `track:${lessonLevel}:${lessonIndex}:${currentTrackQuestion?.id ?? ""}`
      : isErrorMode
        ? `error:${errorId ?? ""}`
        : `practice:${activePracticeQuestion?.id ?? ""}`;

  useEffect(() => {
    setSelectedValue(null);
    setPracticeResult(null);
  }, [activeQuestionKey]);

  useEffect(() => {
    setTrackIndex(0);
    setTrackResults({});
    setTrackFinished(false);
  }, [lessonIndex, lessonLevel]);

  useEffect(() => {
    if (!isSimulation) {
      document.body.classList.remove("simulation-focus");
      return;
    }
    document.body.classList.add("simulation-focus");
    return () => document.body.classList.remove("simulation-focus");
  }, [isSimulation]);

  useEffect(() => {
    if (!isSimulation) return;
    setSimulationIndex(0);
    setSimulationResponses({});
    setSimulationResults(null);
    setSimulationRemaining(20 * 60);
    setSimulationStarted(false);
    setShowDeliveryModal(false);
    finalizedSimulation.current = false;
  }, [isSimulation]);

  useEffect(() => {
    if (!isSimulation || simulationStarted) return;
    setSimulationRemaining(20 * 60);
    setSimulationStarted(true);
  }, [isSimulation, simulationStarted]);

  const finishSimulation = useCallback(() => {
    if (finalizedSimulation.current || simulationResults) return;
    finalizedSimulation.current = true;
    const rows = simulationQuestions.map(question => {
      const value = simulationResponses[question.id] ?? null;
      const blank = value === null;
      const correct =
        !blank && value === getCorrectAnswer(question, effectiveFormat);
      const result = { value, correct, blank };
      recordAnswer({ id: question.id, correct, blank });
      return { question, result };
    });
    setSimulationResults(rows);
    setShowDeliveryModal(false);
  }, [
    effectiveFormat,
    recordAnswer,
    simulationQuestions,
    simulationResponses,
    simulationResults,
  ]);

  useEffect(() => {
    if (!isSimulation || !simulationStarted || simulationResults) return;
    const timer = window.setInterval(
      () => setSimulationRemaining(seconds => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isSimulation, simulationStarted, simulationResults]);

  useEffect(() => {
    if (
      isSimulation &&
      simulationStarted &&
      simulationRemaining === 0 &&
      !simulationResults
    )
      finishSimulation();
  }, [
    finishSimulation,
    isSimulation,
    simulationRemaining,
    simulationResults,
    simulationStarted,
  ]);

  const accessibleQuestions = useMemo(
    () =>
      DEMO_QUESTIONS.filter(
        question => question.level === 1 || levelTwoUnlocked
      ),
    [levelTwoUnlocked]
  );
  const subjects = useMemo(
    () =>
      Array.from(
        new Set(accessibleQuestions.map(question => question.subject))
      ),
    [accessibleQuestions]
  );
  const topics = useMemo(
    () =>
      Array.from(
        new Set(
          accessibleQuestions
            .filter(
              question =>
                !selectedSubject || question.subject === selectedSubject
            )
            .map(question => question.topic)
        )
      ),
    [accessibleQuestions, selectedSubject]
  );
  const filteredQuestions = useMemo(
    () =>
      accessibleQuestions.filter(
        question =>
          (!selectedBoard || question.board === selectedBoard) &&
          (!selectedSubject || question.subject === selectedSubject) &&
          (!selectedTopic || question.topic === selectedTopic) &&
          (!selectedDifficulty || question.difficulty === selectedDifficulty)
      ),
    [
      accessibleQuestions,
      selectedBoard,
      selectedDifficulty,
      selectedSubject,
      selectedTopic,
    ]
  );
  const visibleErrors = state.errorIds
    .map(id => getQuestionById(id))
    .filter((question): question is DemoQuestion => Boolean(question));

  const startPractice = (question: DemoQuestion) => {
    setPracticeQuestionId(question.id);
    setSelectedValue(null);
    setPracticeResult(null);
  };

  const submitPracticeAnswer = (value: string | null) => {
    if (!activePracticeQuestion || practiceResult) return;
    const blank = value === null;
    const correct =
      !blank &&
      value === getCorrectAnswer(activePracticeQuestion, effectiveFormat);
    const result = { value, correct, blank };
    recordAnswer({ id: activePracticeQuestion.id, correct, blank });
    setSelectedValue(value);
    setPracticeResult(result);
  };

  const submitTrackAnswer = (value: string | null) => {
    if (!currentTrackQuestion || trackResults[currentTrackQuestion.id]) return;
    const blank = value === null;
    const correct =
      !blank &&
      value === getCorrectAnswer(currentTrackQuestion, effectiveFormat);
    const result = { value, correct, blank };
    recordAnswer({ id: currentTrackQuestion.id, correct, blank });
    setTrackResults(previous => ({
      ...previous,
      [currentTrackQuestion.id]: result,
    }));
    setSelectedValue(value);
    if (Object.keys(trackResults).length + 1 === 3 && lessonIndex !== null)
      completeLesson(lessonLevel, lessonIndex);
  };

  const submitSimulationChoice = (value: string | null) => {
    if (!currentSimulationQuestion || simulationResults) return;
    setSimulationResponses(previous => ({
      ...previous,
      [currentSimulationQuestion.id]: value,
    }));
  };

  const trackResult = currentTrackQuestion
    ? (trackResults[currentTrackQuestion.id] ?? null)
    : null;
  const currentPracticeResult = practiceResult;
  const currentSimulationValue = currentSimulationQuestion
    ? (simulationResponses[currentSimulationQuestion.id] ?? null)
    : null;
  const progressAnswers = state.answers.length;
  const answeredToday = state.answers.filter(answer => answer.correct).length;

  if (errorId && /^\\d+$/.test(errorId)) return <ErrorReviewSession questionId={Number(errorId)} />;
  if (nodeParam && /^\\d+$/.test(nodeParam)) return <NodeStudySession nodeId={Number(nodeParam)} />;

  if (isSimulation) {
    return (
      <main className="question-page">
        <SectionHeading
          eyebrow="SIMULADO"
          title="Simulados oficiais ainda não estão conectados"
          description="O antigo simulado usava questões fictícias de demonstração. Para não apresentar uma nota enganosa, ele foi desativado até que o banco real e o registro de provas sejam integrados."
        />
        <Card>
          <Tag tone="muted">Em desenvolvimento</Tag>
          <h2>Seu desempenho não será inventado</h2>
          <p>Quando o simulado real estiver disponível, as questões, o cronômetro, as respostas e o resultado serão vinculados à sua conta.</p>
          <MechButton color="green" onClick={() => navigate("/app/trilha")}>Estudar pela trilha <ArrowRight size={16} /></MechButton>
        </Card>
      </main>
    );
  }

  if (lessonIndex !== null) {
    return (
      <main className="question-page">
        <SectionHeading
          eyebrow="SESSÃO DE QUESTÕES"
          title="Use sua trilha personalizada"
          description="A sessão antiga por matéria usava questões fictícias e foi desativada. Agora, as sessões reais são abertas pelos tópicos da sua trilha."
        />
        <Card>
          <Tag tone="muted">Banco demonstrativo desativado</Tag>
          <p>Abra um tópico liberado para gerar questões com IA, responder e registrar seu progresso na conta.</p>
          <MechButton color="green" onClick={() => navigate("/app/trilha")}>Abrir minha trilha <ArrowRight size={16} /></MechButton>
        </Card>
      </main>
    );
  }

  if (isErrorMode) {
    return (
      <main className="question-page">
        <SectionHeading
          eyebrow="CADERNO DE ERROS"
          title="Não foi possível identificar a questão"
          description="Abra a revisão diretamente pelo item do seu caderno de erros para carregar a questão salva na sua conta."
        />
        <MechButton color="white" onClick={() => navigate("/app/perfil")}>Voltar ao caderno de erros <ArrowRight size={16} /></MechButton>
      </main>
    );
  }

  return (
    <main className="question-page questions-home-page">
      <SectionHeading
        eyebrow="SEU ESPAÇO DE ESTUDOS"
        title="Questões e simulados"
        description="As questões da trilha e suas revisões são registradas na sua conta. O banco livre e os simulados completos ainda estão em integração."
      />
      <div className="question-overview-grid">
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-purple"><ListFilter size={17} /></div>
          <div><strong>{state.answers.length}</strong><span>respostas registradas</span></div>
        </Card>
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-green"><Check size={17} /></div>
          <div><strong>{state.nodes.filter(node => node.completed).length}</strong><span>etapas concluídas</span></div>
        </Card>
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-coral"><Sparkles size={17} /></div>
          <div><strong>{state.errors.length}</strong><span>erros para revisar</span></div>
        </Card>
      </div>
      <Card>
        <Tag tone="green">Disponível agora</Tag>
        <h2>Questões da sua trilha</h2>
        <p>Escolha uma etapa liberada. Se ainda não houver questões, você poderá solicitar a geração de três questões com IA para aquele tópico.</p>
        <MechButton color="green" onClick={() => navigate("/app/trilha")}>Ir para a trilha <ArrowRight size={16} /></MechButton>
      </Card>
      <Card>
        <Tag tone="muted">Em desenvolvimento</Tag>
        <h2>Banco livre e simulados</h2>
        <p>Esses módulos só serão ativados quando usarem questões reais, gabaritos validados e salvamento no servidor. As antigas questões fictícias não entram no seu histórico nem na sua pontuação.</p>
      </Card>
    </main>
  );

  if (isSimulation) {
    if (simulationResults) {
      const correctCount = simulationResults.filter(
        row => row.result.correct
      ).length;
      const blankCount = simulationResults.filter(
        row => row.result.blank
      ).length;
      const score = simulationResults.length
        ? Math.round((correctCount / simulationResults.length) * 100)
        : 0;
      return (
        <main className="question-page simulation-page simulation-results-page">
          <div className="simulation-results-header">
            <div className="simulation-brand">
              <div className="simulation-brand-mark">
                <GraduationCap size={21} />
              </div>
              <div>
                <span>
                  ULTRACONCURSOS <b>DEMO</b>
                </span>
                <small>Resultado do simulado</small>
              </div>
            </div>
            <Tag tone={score >= 70 ? "green" : "purple"}>
              {score}% de aproveitamento
            </Tag>
          </div>
          <Card className="simulation-score-card">
            <Frog
              pose={score >= 70 ? "cheer" : "support"}
              className="simulation-result-frog"
            />
            <div className="simulation-score-copy">
              <div className="eyebrow">SEU DESEMPENHO</div>
              <h1>
                {correctCount} <span>/ {simulationResults.length}</span>
              </h1>
              <p>
                {score >= 70
                  ? "Ótimo ritmo! Continue consolidando seus pontos fortes."
                  : "Cada simulado é um mapa do que revisar em seguida."}
              </p>
            </div>
            <div className="simulation-score-stats">
              <div>
                <strong>{correctCount}</strong>
                <span>acertos</span>
              </div>
              <div>
                <strong>
                  {simulationResults.length - correctCount - blankCount}
                </strong>
                <span>erros</span>
              </div>
              <div>
                <strong>{blankCount}</strong>
                <span>em branco</span>
              </div>
            </div>
          </Card>
          <div className="simulation-review-heading">
            <div>
              <div className="eyebrow">REVISÃO QUESTÃO A QUESTÃO</div>
              <h2>Gabarito comentado</h2>
            </div>
            <MechButton
              type="button"
              color="white"
              small
              onClick={() => navigate("/app/questoes")}
            >
              Voltar às questões
            </MechButton>
          </div>
          <div className="simulation-review-list">
            {simulationResults.map((row, index) => (
              <div className="simulation-review-item" key={row.question.id}>
                <div className="review-index">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Tag
                    tone={
                      row.result.correct
                        ? "green"
                        : row.result.blank
                          ? "muted"
                          : "coral"
                    }
                  >
                    {row.result.correct
                      ? "Acerto"
                      : row.result.blank
                        ? "Em branco"
                        : "Revisar"}
                  </Tag>
                </div>
                <QuestionRunner
                  question={row.question}
                  format={effectiveFormat}
                  selectedValue={row.result.value}
                  result={row.result}
                  onSelect={() => undefined}
                  onSubmit={() => undefined}
                  showQuestionTimer={false}
                />
              </div>
            ))}
          </div>
          <div className="simulation-bottom-action">
            <MechButton
              type="button"
              color="purple"
              onClick={() => navigate("/app/questoes")}
            >
              Praticar mais questões <ArrowRight size={17} />
            </MechButton>
          </div>
          <DemoNote>
            Simulado de demonstração: tempo e desempenho ficam apenas neste
            dispositivo.
          </DemoNote>
        </main>
      );
    }

    const unanswered = simulationQuestions.filter(
      question =>
        simulationResponses[question.id] === undefined ||
        simulationResponses[question.id] === null
    ).length;
    const simulationPercent = simulationQuestions.length
      ? ((simulationQuestions.length - unanswered) /
          simulationQuestions.length) *
        100
      : 0;
    return (
      <main className="question-page simulation-page">
        <div className="simulation-topbar">
          <div className="simulation-brand">
            <div className="simulation-brand-mark">
              <GraduationCap size={21} />
            </div>
            <div>
              <span>
                ULTRACONCURSOS <b>DEMO</b>
              </span>
              <small>Simulado · sem pausas</small>
            </div>
          </div>
          <div
            className={`simulation-timer ${simulationRemaining < 120 ? "timer-warning" : ""}`}
            aria-live="polite"
          >
            <Timer size={18} />
            <span>{formatTime(simulationRemaining)}</span>
            <small>restante</small>
          </div>
        </div>
        <div className="simulation-progress-row">
          <div>
            <span>QUESTÃO {String(simulationIndex + 1).padStart(2, "0")}</span>
            <small> de {simulationQuestions.length}</small>
          </div>
          <ProgressBar
            value={simulationPercent}
            color="purple"
            label="Questões respondidas"
          />
          <span>
            {simulationQuestions.length - unanswered}/
            {simulationQuestions.length}
          </span>
        </div>
        <div className="simulation-exam-layout">
          <div className="simulation-question-column">
            {currentSimulationQuestion ? (
              <>
                <div className="simulation-question-title">
                  <div className="eyebrow">PROVA EM ANDAMENTO</div>
                  <h1>Concentre-se em uma questão por vez.</h1>
                  <p>
                    Suas marcações ficam salvas até a entrega. Questões sem
                    resposta contam como em branco.
                  </p>
                </div>
                <div className="session-format-controls simulation-format-controls">
                  <FormatPicker
                    value={formatOverride}
                    onChange={changeFormat}
                    compact
                    disabled={Object.keys(simulationResponses).length > 0}
                  />
                  <FormatHint
                    format={effectiveFormat}
                    board={selectedBoard || state.profile.banca}
                  />
                </div>
                <QuestionRunner
                  question={currentSimulationQuestion}
                  format={effectiveFormat}
                  selectedValue={currentSimulationValue}
                  result={null}
                  onSelect={submitSimulationChoice}
                  onSubmit={submitSimulationChoice}
                  showQuestionTimer={false}
                  allowBlank
                />
                <div className="simulation-nav-row">
                  <MechButton
                    type="button"
                    color="white"
                    disabled={simulationIndex === 0}
                    onClick={() =>
                      setSimulationIndex(index => Math.max(0, index - 1))
                    }
                  >
                    <ArrowLeft size={16} /> Anterior
                  </MechButton>
                  {simulationIndex < simulationQuestions.length - 1 ? (
                    <MechButton
                      type="button"
                      color="purple"
                      onClick={() =>
                        setSimulationIndex(index =>
                          Math.min(simulationQuestions.length - 1, index + 1)
                        )
                      }
                    >
                      Próxima <ArrowRight size={16} />
                    </MechButton>
                  ) : (
                    <MechButton
                      type="button"
                      color="green"
                      onClick={() => setShowDeliveryModal(true)}
                    >
                      <Flag size={16} /> Entregar simulado
                    </MechButton>
                  )}
                </div>
              </>
            ) : (
              <Card>
                <p>
                  Não há questões demonstrativas disponíveis para este simulado.
                </p>
              </Card>
            )}
          </div>
          <aside className="simulation-question-map">
            <Card>
              <div className="question-map-heading">
                <h3>Mapa da prova</h3>
                <span>{simulationQuestions.length} questões</span>
              </div>
              <div className="question-map-grid">
                {simulationQuestions.map((question, index) => {
                  const response = simulationResponses[question.id];
                  return (
                    <MechButton
                      key={question.id}
                      type="button"
                      small
                      color={
                        index === simulationIndex
                          ? "purple"
                          : response
                            ? "green"
                            : "white"
                      }
                      className="question-map-number"
                      aria-label={`Ir para questão ${index + 1}`}
                      aria-current={
                        index === simulationIndex ? "step" : undefined
                      }
                      onClick={() => setSimulationIndex(index)}
                    >
                      {index + 1}
                    </MechButton>
                  );
                })}
              </div>
              <div className="map-legend">
                <span>
                  <i className="legend-current" /> atual
                </span>
                <span>
                  <i className="legend-done" /> marcada
                </span>
                <span>
                  <i className="legend-empty" /> em branco
                </span>
              </div>
              <div className="simulation-reminder">
                <Clock3 size={15} />
                <span>O cronômetro não pausa durante o simulado.</span>
              </div>
              <MechButton
                type="button"
                color="coral"
                className="full-width"
                onClick={() => setShowDeliveryModal(true)}
              >
                Finalizar prova <Flag size={16} />
              </MechButton>
            </Card>
          </aside>
        </div>
        {showDeliveryModal && (
          <Modal
            title="Entregar o simulado?"
            onClose={() => setShowDeliveryModal(false)}
          >
            <div className="delivery-modal-copy">
              <div className="delivery-modal-icon">
                <Flag size={22} />
              </div>
              <p>
                Você respondeu{" "}
                <strong>
                  {simulationQuestions.length - unanswered} de{" "}
                  {simulationQuestions.length}
                </strong>{" "}
                questões. As <strong>{unanswered} em branco</strong> serão
                registradas sem pontuação.
              </p>
              <span>
                Depois da entrega, você verá o resultado e o comentário de cada
                questão. Não é possível pausar ou retomar este simulado.
              </span>
            </div>
            <div className="delivery-modal-actions">
              <MechButton
                type="button"
                color="white"
                onClick={() => setShowDeliveryModal(false)}
              >
                Continuar prova
              </MechButton>
              <MechButton
                type="button"
                color="coral"
                onClick={finishSimulation}
              >
                Entregar agora
              </MechButton>
            </div>
          </Modal>
        )}
        <DemoNote>
          Conteúdo e cronômetro demonstrativos. Nenhuma questão é oficial e
          nenhum conteúdo é gerado por IA.
        </DemoNote>
      </main>
    );
  }

  if (lessonIndex !== null) {
    if (lessonIndex < 0 || lessonIndex > 5 || trackQuestions.length !== 3) {
      return (
        <main className="question-page">
          <SectionHeading
            eyebrow="SESSÃO DE TRILHA"
            title="Sessão indisponível"
            description="Não encontramos este conjunto demonstrativo de questões."
          />
          <MechButton
            type="button"
            color="white"
            onClick={() => navigate("/app/trilha")}
          >
            <ArrowLeft size={16} /> Voltar à trilha
          </MechButton>
        </main>
      );
    }
    if (lessonLevel === 2 && !levelTwoUnlocked) {
      return (
        <main className="question-page">
          <SectionHeading
            eyebrow="PRÓXIMA FASE"
            title="Nível 2 ainda bloqueado"
            description="Complete os seis nós do nível 1 para liberar questões inéditas e mais desafiadoras."
          />
          <Card className="level-gate-card">
            <div className="level-gate-icon">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2>Um passo de cada vez</h2>
              <p>
                Seu próximo nível abre quando todos os seis nós N1 da trilha
                estiverem concluídos.
              </p>
              <div className="level-gate-progress">
                <ProgressBar
                  value={
                    (state.completedNodes.filter(id => /^l1-[0-5]$/.test(id))
                      .length /
                      6) *
                    100
                  }
                  color="purple"
                />
                <span>
                  {
                    state.completedNodes.filter(id => /^l1-[0-5]$/.test(id))
                      .length
                  }
                  /6 nós concluídos
                </span>
              </div>
            </div>
            <MechButton
              type="button"
              color="purple"
              onClick={() => navigate("/app/trilha")}
            >
              Ver minha trilha <ArrowRight size={16} />
            </MechButton>
          </Card>
          <DemoNote>
            As questões de nível 2 são novas e não repetem as do nível 1.
          </DemoNote>
        </main>
      );
    }
    if (
      lessonIndex > 0 &&
      !Array.from(
        { length: lessonIndex },
        (_, index) => `l${lessonLevel}-${index}`
      ).every(id => state.completedNodes.includes(id))
    ) {
      return (
        <main className="question-page">
          <SectionHeading
            eyebrow="PRÉ-REQUISITO DA TRILHA"
            title="Conclua os nós anteriores"
            description={`Para liberar ${LESSON_TITLES[lessonIndex]}, conclua primeiro os nós anteriores do nível ${lessonLevel}.`}
          />
          <Card className="level-gate-card">
            <div className="level-gate-icon">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2>A trilha se abre passo a passo</h2>
              <p>
                Os nós deste nível precisam ser concluídos na ordem antes de
                iniciar esta sessão.
              </p>
              <div className="level-gate-progress">
                <ProgressBar
                  value={
                    (Array.from(
                      { length: lessonIndex },
                      (_, index) => `l${lessonLevel}-${index}`
                    ).filter(id => state.completedNodes.includes(id)).length /
                      lessonIndex) *
                    100
                  }
                  color="purple"
                />
                <span>
                  {
                    Array.from(
                      { length: lessonIndex },
                      (_, index) => `l${lessonLevel}-${index}`
                    ).filter(id => state.completedNodes.includes(id)).length
                  }
                  /{lessonIndex} nós anteriores
                </span>
              </div>
            </div>
            <MechButton
              type="button"
              color="purple"
              onClick={() => navigate("/app/trilha")}
            >
              Ver minha trilha <ArrowRight size={16} />
            </MechButton>
          </Card>
          <DemoNote>
            O acesso direto pela URL respeita os pré-requisitos de cada nível.
          </DemoNote>
        </main>
      );
    }
    if (trackFinished) {
      const results = trackQuestions
        .map(question => trackResults[question.id])
        .filter((result): result is AnswerResult => Boolean(result));
      const correctCount = results.filter(result => result.correct).length;
      return (
        <main className="question-page track-success-page">
          <div className="success-banner">
            <Frog pose={correctCount >= 2 ? "cheer" : "support"} />
            <div>
              <Tag tone="green">
                <Check size={12} /> Sessão concluída
              </Tag>
              <h1>Mais um passo na trilha!</h1>
              <p>
                Você respondeu às três questões de {LESSON_TITLES[lessonIndex]}.
                Sua sessão já foi registrada no progresso.
              </p>
            </div>
          </div>
          <Card className="track-result-card">
            <div className="track-result-score">
              <Trophy size={21} />
              <strong>
                {correctCount}
                <span> / 3</span>
              </strong>
              <small>respostas corretas</small>
            </div>
            <div className="track-result-list">
              {trackQuestions.map((question, index) => {
                const result = trackResults[question.id];
                return (
                  <div className="track-result-row" key={question.id}>
                    <span className="track-result-number">{index + 1}</span>
                    <div>
                      <strong>{question.topic}</strong>
                      <small>
                        {result?.blank
                          ? "Em branco"
                          : result?.correct
                            ? "Acertou"
                            : "Revisar no gabarito"}
                      </small>
                    </div>
                    <Tag
                      tone={
                        result?.correct
                          ? "green"
                          : result?.blank
                            ? "muted"
                            : "coral"
                      }
                    >
                      {result?.correct
                        ? "Acerto"
                        : result?.blank
                          ? "Em branco"
                          : "Erro"}
                    </Tag>
                  </div>
                );
              })}
            </div>
          </Card>
          <div className="success-actions">
            <MechButton
              type="button"
              color="white"
              onClick={() => navigate("/app/trilha")}
            >
              <ArrowLeft size={16} /> Voltar à trilha
            </MechButton>
            <MechButton
              type="button"
              color="purple"
              onClick={() => navigate("/app/questoes")}
            >
              Continuar praticando <ArrowRight size={16} />
            </MechButton>
          </div>
          <DemoNote>
            Conclusão local de demonstração. Questões e comentários são conteúdo
            de amostra.
          </DemoNote>
        </main>
      );
    }
    return (
      <main className="question-page track-session-page">
        <div className="question-page-topline">
          <MechButton
            type="button"
            color="white"
            small
            onClick={() => navigate("/app/trilha")}
          >
            <ArrowLeft size={15} /> Sair da sessão
          </MechButton>
          <Tag tone="purple">
            Nível {lessonLevel} · {LESSON_TITLES[lessonIndex]}
          </Tag>
        </div>
        <SectionHeading
          eyebrow="SESSÃO DA TRILHA"
          title="Três questões. Um passo a mais."
          description="Responda, confira o comentário e siga para a próxima questão."
        />
        <div className="track-session-progress">
          <div className="track-step-label">
            <span>QUESTÃO {trackIndex + 1} DE 3</span>
            <span>{Object.keys(trackResults).length} respondidas</span>
          </div>
          <ProgressBar
            value={(Object.keys(trackResults).length / 3) * 100}
            color="purple"
          />
        </div>
        <FormatHint
          format={effectiveFormat}
          board={selectedBoard || state.profile.banca}
        />
        <div className="session-format-controls">
          <FormatPicker
            value={formatOverride}
            onChange={changeFormat}
            compact
            disabled={
              Object.keys(trackResults).length > 0 || selectedValue !== null
            }
          />
          <span>
            Formato automático:{" "}
            {FORMAT_NAMES[formatForBoard(selectedBoard || state.profile.banca)]}
          </span>
        </div>
        {currentTrackQuestion && (
          <QuestionRunner
            question={currentTrackQuestion}
            format={effectiveFormat}
            selectedValue={trackResult?.value ?? selectedValue}
            result={trackResult}
            onSelect={setSelectedValue}
            onSubmit={submitTrackAnswer}
          />
        )}
        {trackResult && (
          <div className="session-advance-row">
            <span>
              {trackIndex < 2
                ? "Pronto para seguir para a próxima?"
                : "As três questões foram respondidas."}
            </span>
            <MechButton
              type="button"
              color="purple"
              onClick={() =>
                trackIndex < 2
                  ? setTrackIndex(index => index + 1)
                  : setTrackFinished(true)
              }
            >
              {trackIndex < 2 ? (
                <>
                  Próxima questão <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Ver resultado da sessão <Trophy size={16} />
                </>
              )}
            </MechButton>
          </div>
        )}
        <DemoNote>
          Questões demonstrativas. Ao responder as três, esta lição será marcada
          como concluída; deixar em branco conta como resposta, não como acerto.
        </DemoNote>
      </main>
    );
  }

  if (isErrorMode) {
    if (!errorQuestion)
      return (
        <main className="question-page">
          <SectionHeading
            eyebrow="REVISÃO DE ERROS"
            title="Questão não encontrada"
            description="Esse item não está no banco demonstrativo disponível."
          />
          <MechButton
            type="button"
            color="white"
            onClick={() => navigate("/app/questoes")}
          >
            <ArrowLeft size={16} /> Voltar às questões
          </MechButton>
        </main>
      );
    return (
      <main className="question-page error-review-page">
        <div className="question-page-topline">
          <MechButton
            type="button"
            color="white"
            small
            onClick={() => navigate("/app/questoes")}
          >
            <ArrowLeft size={15} /> Voltar ao banco
          </MechButton>
          <Tag tone="coral">
            <Sparkles size={12} /> Revisão de erro
          </Tag>
        </div>
        <SectionHeading
          eyebrow="VAMOS REVISAR JUNTOS"
          title="Um erro bem revisado vira ponto forte."
          description="Tente de novo com calma. O comentário mostra o raciocínio e a pegadinha."
        />
        <FormatHint
          format={effectiveFormat}
          board={selectedBoard || state.profile.banca}
        />
        <div className="session-format-controls">
          <FormatPicker
            value={formatOverride}
            onChange={changeFormat}
            compact
            disabled={Boolean(practiceResult) || selectedValue !== null}
          />
          <span>Esta revisão não conclui uma lição da trilha.</span>
        </div>
        <QuestionRunner
          question={errorQuestion}
          format={effectiveFormat}
          selectedValue={practiceResult?.value ?? selectedValue}
          result={currentPracticeResult}
          onSelect={setSelectedValue}
          onSubmit={submitPracticeAnswer}
        />
        {practiceResult && (
          <div className="session-advance-row">
            <span>
              {practiceResult.correct
                ? "Questão removida da lista de erros."
                : "Pode tentar novamente depois."}
            </span>
            <MechButton
              type="button"
              color="purple"
              onClick={() => navigate("/app/questoes")}
            >
              Concluir revisão <ArrowRight size={16} />
            </MechButton>
          </div>
        )}
        <DemoNote>
          Item de amostra para revisão. O erro e o progresso são salvos
          localmente.
        </DemoNote>
      </main>
    );
  }

  if (activePracticeQuestion) {
    return (
      <main className="question-page practice-question-page">
        <div className="question-page-topline">
          <MechButton
            type="button"
            color="white"
            small
            onClick={() => {
              setPracticeQuestionId(null);
              setPracticeResult(null);
            }}
          >
            <ArrowLeft size={15} /> Voltar ao banco
          </MechButton>
          <Tag tone="purple">Treino livre</Tag>
        </div>
        <SectionHeading
          eyebrow="QUESTÃO DEMONSTRATIVA"
          title="Resolva no seu ritmo."
          description="Marque sua resposta, confira o gabarito comentado e identifique a armadilha."
        />
        <FormatHint
          format={effectiveFormat}
          board={selectedBoard || state.profile.banca}
        />
        <div className="session-format-controls">
          <FormatPicker
            value={formatOverride}
            onChange={changeFormat}
            compact
            disabled={Boolean(practiceResult) || selectedValue !== null}
          />
          <span>Formato automático pela banca selecionada.</span>
        </div>
        <QuestionRunner
          question={activePracticeQuestion}
          format={effectiveFormat}
          selectedValue={practiceResult?.value ?? selectedValue}
          result={currentPracticeResult}
          onSelect={setSelectedValue}
          onSubmit={submitPracticeAnswer}
        />
        {practiceResult && (
          <div className="session-advance-row">
            <span>
              {practiceResult.correct
                ? "Resposta registrada no seu progresso."
                : "A explicação já está logo acima."}
            </span>
            <MechButton
              type="button"
              color="purple"
              onClick={() => {
                setPracticeQuestionId(null);
                setPracticeResult(null);
              }}
            >
              Voltar às questões <ArrowRight size={16} />
            </MechButton>
          </div>
        )}
        <DemoNote>
          Conteúdo de amostra, sem geração de respostas por IA.
        </DemoNote>
      </main>
    );
  }

  const firstPracticeQuestion = filteredQuestions[0];
  return (
    <main className="question-page questions-home-page">
      <SectionHeading
        eyebrow="SEU ESPAÇO DE PRÁTICA"
        title="Questões"
        description="Pratique com comentários claros e acompanhe seus avanços, uma questão por vez."
        action={
          <MechButton
            type="button"
            color="purple"
            onClick={() => navigate("/app/questoes?mode=simulado")}
          >
            <Timer size={16} /> Simulado · 20 min
          </MechButton>
        }
      />
      <div className="question-welcome-strip">
        <div className="welcome-strip-icon">
          <Target size={21} />
        </div>
        <div>
          <strong>Pequenos treinos, grandes avanços.</strong>
          <span>
            O banco abaixo é demonstrativo: questões e comentários não foram
            gerados por IA.
          </span>
        </div>
        <MechButton
          type="button"
          color="green"
          small
          disabled={!firstPracticeQuestion}
          onClick={() =>
            firstPracticeQuestion && startPractice(firstPracticeQuestion)
          }
        >
          Começar treino <ArrowRight size={15} />
        </MechButton>
      </div>

      <div className="question-overview-grid">
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-purple">
            <ListFilter size={17} />
          </div>
          <div>
            <strong>{accessibleQuestions.length}</strong>
            <span>questões demonstrativas</span>
          </div>
        </Card>
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-green">
            <Check size={17} />
          </div>
          <div>
            <strong>{answeredToday}</strong>
            <span>respostas corretas no progresso</span>
          </div>
        </Card>
        <Card className="overview-stat">
          <div className="overview-stat-icon stat-coral">
            <Sparkles size={17} />
          </div>
          <div>
            <strong>{visibleErrors.length}</strong>
            <span>para revisar</span>
          </div>
        </Card>
      </div>

      <div className="question-home-layout">
        <section className="question-bank-column">
          <Card className="question-filter-card">
            <div className="filter-card-heading">
              <div>
                <div className="eyebrow">BUSCA NO BANCO</div>
                <h2>Monte seu treino</h2>
              </div>
              <Tag tone="muted">
                <ListFilter size={12} />
                {filteredQuestions.length} itens
              </Tag>
            </div>
            <div className="question-filters-grid">
              <label className="question-control">
                <span>Matéria</span>
                <select
                  value={selectedSubject}
                  onChange={event => {
                    setSelectedSubject(event.target.value);
                    setSelectedTopic("");
                  }}
                >
                  <option value="">Todas as matérias</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>
              <label className="question-control">
                <span>Assunto</span>
                <select
                  value={selectedTopic}
                  onChange={event => setSelectedTopic(event.target.value)}
                >
                  <option value="">Todos os assuntos</option>
                  {topics.map(topic => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
              <label className="question-control">
                <span>Banca</span>
                <select
                  value={selectedBoard}
                  onChange={event => setSelectedBoard(event.target.value)}
                >
                  <option value="">Todas as bancas</option>
                  {BOARD_NAMES.map(board => (
                    <option key={board} value={board}>
                      {board}
                    </option>
                  ))}
                </select>
              </label>
              <label className="question-control">
                <span>Dificuldade</span>
                <select
                  value={selectedDifficulty}
                  onChange={event => setSelectedDifficulty(event.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="Fácil">Fácil</option>
                  <option value="Médio">Média</option>
                  <option value="Difícil">Difícil</option>
                </select>
              </label>
            </div>
            <div className="filter-format-row">
              <FormatPicker
                value={formatOverride}
                onChange={setFormatOverride}
                compact
              />
              <FormatHint
                format={effectiveFormat}
                board={selectedBoard || state.profile.banca}
              />
            </div>
          </Card>

          <div className="question-list-heading">
            <div>
              <div className="eyebrow">QUESTÕES PARA VOCÊ</div>
              <h2>Escolha por onde começar</h2>
            </div>
            <span>{filteredQuestions.length} resultados</span>
          </div>
          {filteredQuestions.length ? (
            <div className="question-bank-list">
              {filteredQuestions.map(question => {
                const previous = state.answers.find(
                  answer => answer.id === question.id
                );
                return (
                  <Card className="question-bank-item" key={question.id}>
                    <div className="bank-item-main">
                      <div className="bank-item-tags">
                        <Tag tone="purple">{question.subject}</Tag>
                        <Tag
                          tone={
                            question.difficulty === "Difícil"
                              ? "coral"
                              : question.difficulty === "Fácil"
                                ? "green"
                                : "muted"
                          }
                        >
                          {question.difficulty}
                        </Tag>
                        {question.level === 2 && (
                          <Tag tone="coral">Nível 2</Tag>
                        )}
                      </div>
                      <h3>{question.topic}</h3>
                      <p>{question.prompt}</p>
                      <div className="bank-item-meta">
                        <span>{question.board}</span>
                        <span>·</span>
                        <span>
                          {FORMAT_NAMES[formatForBoard(question.board)]}
                        </span>
                        {previous && (
                          <Tag
                            tone={
                              previous.correct
                                ? "green"
                                : previous.blank
                                  ? "muted"
                                  : "coral"
                            }
                          >
                            {previous.correct
                              ? "Acertou antes"
                              : previous.blank
                                ? "Em branco"
                                : "Revisar"}
                          </Tag>
                        )}
                      </div>
                    </div>
                    <MechButton
                      type="button"
                      color="white"
                      small
                      onClick={() => startPractice(question)}
                    >
                      Resolver <ArrowRight size={15} />
                    </MechButton>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="empty-question-state">
              <div className="empty-state-icon">
                <ListFilter size={23} />
              </div>
              <h3>Nenhuma questão com esses filtros</h3>
              <p>Experimente outra matéria, banca ou dificuldade.</p>
              <MechButton
                type="button"
                color="white"
                small
                onClick={() => {
                  setSelectedSubject("");
                  setSelectedTopic("");
                  setSelectedDifficulty("");
                  setSelectedBoard("");
                }}
              >
                Limpar filtros
              </MechButton>
            </Card>
          )}
        </section>

        <aside className="question-sidebar">
          <Card className="question-quick-card">
            <div className="quick-card-art">
              <Frog pose="study" decorative />
              <div>
                <div className="eyebrow">RITMO DE ESTUDO</div>
                <h3>Seu progresso está no caminho.</h3>
              </div>
            </div>
            <div className="quick-progress-row">
              <span>Respostas registradas</span>
              <strong>{progressAnswers}</strong>
            </div>
            <ProgressBar
              value={Math.min(100, (progressAnswers / 20) * 100)}
              color="green"
              label="Respostas registradas"
            />
            <p className="quick-card-note">
              Cada questão respondida alimenta seu histórico local. Não conclui
              uma lição da trilha.
            </p>
          </Card>
          <Card className="question-error-card">
            <div className="error-card-header">
              <div className="overview-stat-icon stat-coral">
                <Sparkles size={17} />
              </div>
              <div>
                <div className="eyebrow">REVISÃO INTELIGENTE</div>
                <h3>Seus erros</h3>
              </div>
              <Tag tone="coral">{visibleErrors.length}</Tag>
            </div>
            {visibleErrors.length ? (
              <div className="error-question-list">
                {visibleErrors.map(question => (
                  <div className="error-question-row" key={question.id}>
                    <div>
                      <strong>{question.topic}</strong>
                      <small>{question.subject}</small>
                    </div>
                    <MechButton
                      type="button"
                      color="white"
                      small
                      onClick={() =>
                        navigate(
                          `/app/questoes?error=${encodeURIComponent(question.id)}`
                        )
                      }
                    >
                      Rever <ArrowRight size={13} />
                    </MechButton>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-errors-message">
                <Check size={16} />
                <span>Nenhum erro pendente. Continue praticando!</span>
              </div>
            )}
          </Card>
          <Card className="question-sim-card">
            <div className="sim-card-icon">
              <Timer size={20} />
            </div>
            <div>
              <div className="eyebrow">DESAFIO DO DIA</div>
              <h3>Teste seu foco por 20 minutos</h3>
              <p>
                Modo concentrado, navegação entre questões e resultado no final.
              </p>
              <MechButton
                type="button"
                color="purple"
                small
                onClick={() => navigate("/app/questoes?mode=simulado")}
              >
                Iniciar simulado <ArrowRight size={14} />
              </MechButton>
            </div>
          </Card>
          <div className="question-page-footnote">
            <ShieldCheck size={15} />
            <span>Estudo de demonstração · sem conteúdo gerado por IA.</span>
          </div>
        </aside>
      </div>
      <DemoNote>
        O banco contém conteúdo demonstrativo. Seu progresso é salvo somente
        neste dispositivo.
      </DemoNote>
    </main>
  );
}
