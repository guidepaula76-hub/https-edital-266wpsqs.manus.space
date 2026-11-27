import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles, GraduationCap, Clock3, ClipboardList, Eye, EyeOff, FileText, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Brand, Frog, MechButton, Card, ProgressBar, Tag } from "@/components/ultra/UI";
import { useProgress } from "@/lib/progress";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { BOARDS, boardFormat, goalInputSchema, type DisciplineDraft, type ExamFormat, type VerticalizationResponse } from "@shared/ultra";
import "./entry.css";

export function Auth({ signup = false }: { signup?: boolean }) {
  const [, navigate] = useLocation();
  const auth = useAuth();
  const progress = useProgress();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      if (signup) await auth.signup(name.trim(), email.trim(), password); else await auth.login(email.trim(), password);
      setPassword(""); toast.success(signup ? "Conta criada. Vamos conhecer seu objetivo!" : "Bem-vindo de volta!");
      if (signup) navigate("/onboarding");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  };
  if (auth.user && !progress.loading && !progress.error) return <Redirect to={progress.state.goal ? "/app" : "/onboarding"} />;
  return <div className="entry-page">
    <header className="entry-header"><Brand /><button onClick={() => navigate("/")}><ArrowLeft size={16} /> Voltar ao site</button></header>
    <main className="auth-layout">
      <section className="auth-story"><Tag tone="green"><Sparkles size={12} /> PEQUENOS PASSOS. GRANDES CONQUISTAS.</Tag>
        <h1>{signup ? <>Seu próximo capítulo<br />começa aqui.</> : <>Que bom ter você<br />por aqui de novo.</>}</h1>
        <p>Um objetivo claro. Uma trilha possível.<br />E um companheiro em cada salto.</p><Frog pose={signup ? "cheer" : "support"} />
        <div className="auth-promise"><ShieldCheck size={17} /><span>Seu progresso seguro, na sua conta.</span></div>
      </section>
      <Card className="auth-card"><h2>{signup ? "Vamos começar?" : "Continue sua jornada."}</h2><p>{signup ? "Crie sua conta e prepare seu plano de estudos." : "Entre para retomar seu próximo passo."}</p>
        <form onSubmit={submit}>
          {signup && <div className="form-field"><label htmlFor="name">Como podemos chamar você?</label><input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" autoComplete="name" minLength={2} maxLength={60} required disabled={busy} /></div>}
          <div className="form-field"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" maxLength={254} required disabled={busy} /></div>
          <div className="form-field"><label htmlFor="password">Senha</label><div className="password-field"><input id="password" type={visible ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} maxLength={128} required autoComplete={signup ? "new-password" : "current-password"} disabled={busy} /><button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          <div className="auth-security-note"><ShieldCheck size={16} /><span>Sua senha é protegida por hash. Nunca a armazenamos em texto simples.</span></div>
          {(error || auth.error || progress.error) && <p role="alert" className="entry-error">{error || auth.error || progress.error}</p>}
          {auth.user && progress.error && <MechButton type="button" color="white" onClick={() => void progress.refresh().catch(() => {})}>Tentar carregar meus estudos</MechButton>}
          <MechButton className="full-width" type="submit" disabled={busy || auth.loading || Boolean(auth.user)}>{busy || (auth.user && progress.loading) ? <><Loader2 className="spin" size={17} /> Aguarde…</> : <>{signup ? "Criar minha conta" : "Entrar"} <ArrowRight size={17} /></>}</MechButton>
        </form>
        <div className="auth-divider"><span>ou use sua conta Google</span></div>
        <MechButton className="full-width" color="white" disabled={busy || !auth.googleEnabled || Boolean(auth.user)} onClick={() => { setError(""); void auth.googleLogin().catch(e => setError(e.message)); }}><span className="google-letter" aria-hidden="true">G</span> Entrar com Google</MechButton>
        {!auth.googleEnabled && <p className="field-help">Google ainda não configurado. Você pode entrar com e-mail e senha.</p>}
        <p className="field-help">No Preview, permita pop-ups e cookies para concluir o login. Se o Google indicar redirect_uri_mismatch, o callback precisa ser cadastrado no Google Cloud.</p>
        <p className="auth-switch">{signup ? "Já tem uma conta?" : "Ainda não tem conta?"} <button onClick={() => navigate(signup ? "/login" : "/cadastro")}>{signup ? "Entrar" : "Começar agora"}</button></p>
      </Card>
    </main>
  </div>;
}
function fileBase64(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = () => reject(new Error("Não foi possível ler este arquivo.")); reader.readAsDataURL(file); });
}
export function Onboarding() {
  const [, navigate] = useLocation(); const { state, refresh } = useProgress(); const auth = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ concurso: state.profile.concurso, cargo: state.profile.cargo, nivel: state.profile.nivel as "Fundamental" | "Médio" | "Superior", banca: BOARDS.includes(state.profile.banca as typeof BOARDS[number]) ? state.profile.banca : "Outra", format: state.profile.format, hours: state.profile.hours, examDate: state.profile.examDate });
  const [otherBoard, setOtherBoard] = useState(BOARDS.includes(state.profile.banca as typeof BOARDS[number]) ? "" : state.profile.banca);
  const [text, setText] = useState(""); const [source, setSource] = useState<"text" | "pdf">("text"); const [file, setFile] = useState<File | null>(null);
  const [disciplines, setDisciplines] = useState<DisciplineDraft[]>(state.goal?.disciplines ?? []);
  const [documentId, setDocumentId] = useState<number | null>(state.goal?.documentId ?? null);
  const [warnings, setWarnings] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const update = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));
  const changedSource = () => { setDocumentId(null); setWarnings([]); };
  const verticalize = async () => {
    if (busy) return; setError("");
    if (source === "text" && text.trim().length < 20) { setError("Cole o conteúdo programático, com matérias e assuntos do seu cargo."); return; }
    if (source === "pdf" && !file) { setError("Selecione o PDF do edital."); return; }
    setBusy(true);
    try {
      const data = source === "pdf"
        ? await api<VerticalizationResponse>("/api/study/verticalize-pdf", { method: "POST", body: { name: file!.name, base64: await fileBase64(file!), concurso: form.concurso, cargo: form.cargo } })
        : await api<VerticalizationResponse>("/api/study/verticalize", { method: "POST", body: { text, concurso: form.concurso, cargo: form.cargo } });
      setDisciplines(data.disciplines); setDocumentId(data.documentId); setWarnings(data.warnings);
      toast.success("Edital organizado. Confira e ajuste a prévia abaixo.");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível organizar o edital."); }
    finally { setBusy(false); }
  };
  const advance = async () => {
    if (busy) return; setError("");
    if (!form.concurso.trim() || !form.cargo.trim()) { setError("Informe o concurso e o cargo."); return; }
    if (step === 1 && form.banca === "Outra" && otherBoard.trim().length < 2) { setError("Informe o nome da banca municipal ou de outra organizadora."); return; }
    if (step < 2) { setStep(step + 1); return; }
    const body = { ...form, banca: form.banca === "Outra" ? otherBoard.trim() : form.banca, disciplines, documentId };
    const parsed = goalInputSchema.safeParse(body);
    if (!parsed.success) { setError("Revise o objetivo e inclua pelo menos uma matéria com um tópico. Remova linhas vazias e use até 150 tópicos."); return; }
    setBusy(true);
    try {
      await api("/api/study/goals", { method: "POST", body: parsed.data }); await refresh();
      toast.success("Seu plano foi salvo. Bora dar o primeiro salto?"); navigate("/app");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar. Sua edição foi preservada."); }
    finally { setBusy(false); }
  };
  const steps = [{ title: "Qual é o seu objetivo?", description: "Cada jornada começa com um destino.", icon: GraduationCap }, { title: "Vamos conhecer sua prova.", description: "Seu estudo deve falar a língua da sua banca.", icon: ClipboardList }, { title: "Do edital à sua rotina.", description: "Organize, confira e salve sua trilha personalizada.", icon: Clock3 }];
  const Icon = steps[step].icon;
  return <div className="entry-page">
    <header className="entry-header"><Brand />{state.goal ? <button onClick={() => navigate("/app")} disabled={busy}>Voltar à minha jornada <ArrowRight size={16} /></button> : <button onClick={() => void auth.logout().catch(e => toast.error(e.message))}>Sair da conta</button>}</header>
    <main className="onboarding-layout"><div className="onboard-progress"><span>PASSO {step + 1} DE 3</span><ProgressBar value={((step + 1) / 3) * 100} color="purple" /></div>
      <Card className="onboard-card"><div className="onboard-heading"><span><Icon size={25} /></span><div><h1>{steps[step].title}</h1><p>{steps[step].description}</p></div></div>
        {step === 0 && <>
          <div className="form-field"><label htmlFor="concurso">Concurso que você quer conquistar</label><input id="concurso" placeholder="Ex.: INSS, Polícia Federal, TJ-SP..." value={form.concurso} onChange={e => update("concurso", e.target.value)} maxLength={180} required /></div>
          <div className="form-grid"><div className="form-field"><label htmlFor="cargo">Cargo</label><input id="cargo" placeholder="Ex.: Técnico administrativo" value={form.cargo} onChange={e => update("cargo", e.target.value)} maxLength={180} required /></div><div className="form-field"><label htmlFor="nivel">Nível exigido</label><select id="nivel" value={form.nivel} onChange={e => update("nivel", e.target.value)}><option>Fundamental</option><option>Médio</option><option>Superior</option></select></div></div>
          <div className="form-field"><label htmlFor="date">Data prevista da prova (opcional)</label><input id="date" type="date" value={form.examDate} onChange={e => update("examDate", e.target.value)} /><p className="field-help">Data informada por você. Confirme sempre o calendário oficial.</p></div>
        </>}
        {step === 1 && <>
          <div className="form-field"><label htmlFor="banca">Banca examinadora</label><select id="banca" value={form.banca} onChange={e => setForm(f => ({ ...f, banca: e.target.value, format: boardFormat(e.target.value) }))}>{BOARDS.map(b => <option key={b}>{b}</option>)}</select></div>
          {form.banca === "Outra" && <div className="form-field"><label htmlFor="other-board">Nome da banca</label><input id="other-board" value={otherBoard} maxLength={100} onChange={e => setOtherBoard(e.target.value)} placeholder="Banca municipal ou outra organizadora" /></div>}
          <label>Formato padrão da prova</label><div className="format-options">{[{ id: "CE", label: "Certo / Errado", detail: "2 opções + em branco" }, { id: "AD", label: "A a D", detail: "4 alternativas" }, { id: "AE", label: "A a E", detail: "5 alternativas" }].map(f => <MechButton color={form.format === f.id ? "purple" : "white"} key={f.id} onClick={() => update("format", f.id as ExamFormat)} aria-pressed={form.format === f.id}><strong>{f.label}</strong><small>{f.detail}</small></MechButton>)}</div>
          <div className="onboard-tip"><Frog pose="support" decorative /><p>Cebraspe/Quadrix costumam usar Certo/Errado; IBAM, A–D. Confirme o formato no seu edital: ele pode variar dentro da mesma banca.</p></div>
        </>}
        {step === 2 && <>
          <div className="form-field"><label htmlFor="hours">Tempo disponível por dia</label><div className="hours-selector"><input id="hours" type="range" min={0.5} max={12} step={0.5} value={form.hours} onChange={e => update("hours", Number(e.target.value))} disabled={busy} /><strong>{form.hours.toLocaleString("pt-BR")} h</strong></div><p className="field-help">Comece com uma meta que você consiga manter.</p></div>
          <div className="source-picker"><MechButton color={source === "text" ? "purple" : "white"} small disabled={busy} onClick={() => { setSource("text"); changedSource(); }}><FileText size={15} /> Colar conteúdo</MechButton><MechButton color={source === "pdf" ? "purple" : "white"} small disabled={busy} onClick={() => { setSource("pdf"); changedSource(); }}><Upload size={15} /> Enviar PDF</MechButton></div>
          {source === "text" ? <div className="form-field"><label htmlFor="edital">Conteúdo programático do seu cargo</label><textarea id="edital" rows={6} placeholder={"LÍNGUA PORTUGUESA: Interpretação de textos; concordância.\nDIREITO CONSTITUCIONAL: Direitos fundamentais; organização do Estado."} value={text} onChange={e => { setText(e.target.value); changedSource(); }} maxLength={120000} disabled={busy} /><p className="field-help">Até 120 mil caracteres. Evite dados pessoais; envie somente as matérias e assuntos que deseja estudar.</p></div>
            : <div className="form-field pdf-upload"><label htmlFor="edital-pdf">PDF do edital, até 8 MB</label><input id="edital-pdf" type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e => { const selected = e.target.files?.[0]; if (!selected) return; if (!selected.name.toLowerCase().endsWith(".pdf") || selected.size > 8 * 1024 * 1024) { setError("Selecione um PDF com no máximo 8 MB."); e.target.value = ""; return; } setFile(selected); changedSource(); setError(""); }} /><p className="field-help">{file ? file.name : "Selecione o arquivo. PDFs escaneados sem texto precisam de uma versão legível ou do conteúdo colado."}</p></div>}
          <MechButton color="purple" disabled={busy} onClick={() => void verticalize()}>{busy ? <><Loader2 className="spin" size={16} /> Organizando…</> : <><Sparkles size={16} /> Verticalizar com IA</>}</MechButton>
          <p className="field-help">Nesta versão, você pode fazer até 3 verticalizações por dia. Confira a prévia com o edital oficial; nada é aplicado à sua trilha antes de salvar.</p>
          {warnings.length > 0 && <div className="entry-warning" role="status">{warnings.map((w, i) => <p key={i}>{w}</p>)}</div>}
          <div className="syllabus-preview"><div className="row-between"><h3>{disciplines.length ? "Confira sua trilha" : "Prefere montar manualmente?"}</h3><Tag tone="purple">{disciplines.reduce((n, d) => n + d.topics.filter(t => t.trim()).length, 0)} tópicos</Tag></div>
            <p className="field-help">Edite os nomes e use um assunto por linha. Cada tópico vira um nó em cada nível. O avançado abre após concluir o Nível 1.</p>
            {disciplines.map((discipline, i) => <div className="syllabus-discipline" key={i}><div className="form-field"><label htmlFor={`discipline-${i}`}>Matéria {i + 1}</label><div className="inline-row"><input id={`discipline-${i}`} value={discipline.name} maxLength={140} disabled={busy} onChange={e => setDisciplines(ds => ds.map((d, index) => index === i ? { ...d, name: e.target.value } : d))} /><button type="button" className="icon-button" disabled={busy} onClick={() => setDisciplines(ds => ds.filter((_, index) => index !== i))} aria-label={`Remover matéria ${i + 1}`}><Trash2 size={16} /></button></div></div><div className="form-field"><label htmlFor={`topics-${i}`}>Assuntos — um por linha</label><textarea id={`topics-${i}`} value={discipline.topics.join("\n")} rows={Math.min(7, Math.max(3, discipline.topics.length + 1))} disabled={busy} onChange={e => setDisciplines(ds => ds.map((d, index) => index === i ? { ...d, topics: e.target.value.split("\n") } : d))} /></div></div>)}
            <MechButton small color="white" disabled={busy || disciplines.length >= 30} onClick={() => setDisciplines(ds => [...ds, { name: "", topics: [""] }])}><Plus size={15} /> Adicionar matéria</MechButton>
          </div>
        </>}
        {error && <p role="alert" className="entry-error">{error}</p>}
        <div className="onboard-actions"><MechButton color="white" disabled={busy} onClick={() => step ? setStep(step - 1) : navigate(state.goal ? "/app" : "/")}><ArrowLeft size={16} /> Voltar</MechButton><MechButton disabled={busy} onClick={() => void advance()}>{busy ? "Aguarde…" : step === 2 ? "Salvar minha jornada" : "Continuar"} <ArrowRight size={17} /></MechButton></div>
      </Card>
    </main>
  </div>;
}
