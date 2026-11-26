import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { ErrorEntry, Goal, StudySnapshot, TrailNode } from "@shared/ultra";
import { api } from "./api";
import { useAuth } from "./auth";
import { toast } from "sonner";
export type ExamFormat = "CE" | "AD" | "AE";
export interface StudentProfile {
  name: string; concurso: string; cargo: string; nivel: string; banca: string;
  format: ExamFormat; hours: number; examDate: string; editalTopics: string[];
}
export interface AnswerRecord { id: string; correct: boolean; blank?: boolean; subject?: string; topic?: string; createdAt?: string; questionId?: number; nodeId?: number }
export interface StudyState {
  profile: StudentProfile; xp: number; streak: number; completedNodes: string[];
  answers: AnswerRecord[]; errorIds: string[]; sound: boolean; dailyGoal: number;
  lastStudyDay: string; scheduleRevision: number; writing: string; rewardedAnswers: string[];
  goal: Goal | null; nodes: TrailNode[]; errors: ErrorEntry[];
}
export const initialState: StudyState = {
  profile: { name: "Estudante", concurso: "", cargo: "", nivel: "Médio", banca: "Cebraspe", format: "CE", hours: 2, examDate: "", editalTopics: [] },
  xp: 0, streak: 0, completedNodes: [], answers: [], errorIds: [], sound: false,
  dailyGoal: 50, lastStudyDay: "", scheduleRevision: 0, writing: "", rewardedAnswers: [],
  goal: null, nodes: [], errors: [],
};
type Value = {
  state: StudyState; loading: boolean; error: string | null; refresh(): Promise<void>;
  updateProfile(profile: Partial<StudentProfile>): Promise<void>;
  recordAnswer(answer: AnswerRecord): void; completeLesson(level: number, index: number): void;
  setSound(value: boolean): Promise<void>; setWriting(value: string): void;
  recalculateSchedule(): void; resetProgress(): void;
};
const Context = createContext<Value | null>(null);
function fromSnapshot(snapshot: StudySnapshot, name: string): StudyState {
  const goal = snapshot.goal;
  return { ...initialState, ...snapshot,
    profile: { ...initialState.profile, name, ...(goal ? { concurso: goal.concurso, cargo: goal.cargo, nivel: goal.nivel, banca: goal.banca, format: goal.format, hours: goal.hours, examDate: goal.examDate, editalTopics: goal.disciplines.flatMap(d => d.topics) } : {}) },
    completedNodes: snapshot.nodes.filter(n => n.completed).map(n => `l${n.level}-${n.position}`),
    errorIds: snapshot.errors.map(e => String(e.questionId)), answers: snapshot.answers,
  };
}
export function ProgressProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const userId = auth.user?.id;
  const [state, setState] = useState<StudyState>(initialState);
  const [owner, setOwner] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef(0);
  const currentUser = useRef(userId); currentUser.current = userId;
  const writingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const id = ++revision.current; setLoading(true); setError(null);
    try {
      const snapshot = await api<StudySnapshot>("/api/study/snapshot");
      if (id === revision.current && currentUser.current === userId) { setState(fromSnapshot(snapshot, auth.user?.name ?? "Estudante")); setOwner(userId); }
    } catch (e) {
      if (id === revision.current) { setError(e instanceof Error ? e.message : "Não foi possível carregar seus estudos."); throw e; }
    } finally { if (id === revision.current) setLoading(false); }
  }, [userId, auth.user?.name]);
  useEffect(() => {
    ++revision.current; clearTimeout(writingTimer.current); setState(initialState); setOwner(undefined); setError(null);
    localStorage.removeItem("ultraconcursos-demo-v1");
    if (userId) void refresh().catch(() => {}); else setLoading(false);
    return () => { ++revision.current; clearTimeout(writingTimer.current); };
  }, [userId]);
  useEffect(() => { if (auth.user && owner === auth.user.id) setState(s => ({ ...s, profile: { ...s.profile, name: auth.user!.name } })); }, [auth.user?.name, owner]);
  const savePreference = async (body: unknown) => { if (!userId) return; await api("/api/study/preferences", { method: "PATCH", body }); };
  const value: Value = {
    state: owner === userId ? state : { ...initialState, profile: { ...initialState.profile, name: auth.user?.name ?? "Estudante" } },
    loading: auth.loading || loading || Boolean(userId && owner !== userId && !error), error, refresh,
    updateProfile: async profile => {
      if (profile.name !== undefined) await auth.updateName(profile.name);
      if (Object.keys(profile).some(k => k !== "name")) throw new Error("Ajuste seu objetivo no onboarding para salvar concurso e edital.");
    },
    recordAnswer: () => { void refresh().catch(() => {}); },
    completeLesson: () => { void refresh().catch(() => {}); },
    setSound: async sound => { await savePreference({ sound }); if (currentUser.current === userId) setState(s => ({ ...s, sound })); },
    setWriting: writing => {
      setState(s => ({ ...s, writing })); clearTimeout(writingTimer.current);
      const savedFor = userId;
      writingTimer.current = setTimeout(() => { if (currentUser.current === savedFor) void savePreference({ writing }).catch(e => toast.error(e.message)); }, 650);
    },
    recalculateSchedule: () => { const scheduleRevision = state.scheduleRevision + 1; void savePreference({ scheduleRevision }).then(() => setState(s => ({ ...s, scheduleRevision }))).catch(e => toast.error(e.message)); },
    resetProgress: () => toast.info("O progresso real é preservado. Crie um novo objetivo para iniciar outra trilha."),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useProgress() { const value = useContext(Context); if (!value) throw new Error("Study progress provider ausente."); return value; }
export function daysUntilExam(date: string) {
  if (!date) return 0;
  const end = new Date(`${date}T23:59:59`); return Number.isNaN(end.getTime()) ? 0 : Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}
let audio: AudioContext | undefined;
export function playClick(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    audio ??= new AudioContext(); void audio.resume(); const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.type = "sine"; oscillator.frequency.setValueAtTime(620, audio.currentTime); oscillator.frequency.exponentialRampToValueAtTime(380, audio.currentTime + 0.06);
    gain.gain.setValueAtTime(0.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.08);
  } catch { /* Som opcional. */ }
}
