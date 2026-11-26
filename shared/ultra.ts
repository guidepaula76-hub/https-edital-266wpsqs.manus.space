import { z } from "zod";

export const examFormatSchema = z.enum(["CE", "AD", "AE"]);
export type ExamFormat = z.infer<typeof examFormatSchema>;
export const BOARDS = ["Cebraspe", "FGV", "FCC", "Vunesp", "Cesgranrio", "IBFC", "IBAM", "Quadrix", "Outra"] as const;
export function boardFormat(board: string): ExamFormat {
  const b = board.trim().toLowerCase();
  return ["cebraspe", "quadrix"].includes(b) ? "CE" : ["ibam", "ibfc"].includes(b) ? "AD" : "AE";
}
export const disciplineSchema = z.object({
  name: z.string().trim().min(2).max(140),
  topics: z.array(z.string().trim().min(2).max(300)).min(1).max(30),
}).strict();
export const syllabusSchema = z.object({
  disciplines: z.array(disciplineSchema).min(1).max(30),
  warnings: z.array(z.string().max(500)).max(10),
}).strict().refine(s => s.disciplines.reduce((n, d) => n + d.topics.length, 0) <= 150, "Use até 150 tópicos por edital.");
export type DisciplineDraft = z.infer<typeof disciplineSchema>;
export type Syllabus = z.infer<typeof syllabusSchema>;
export const goalInputSchema = z.object({
  concurso: z.string().trim().min(2).max(180),
  cargo: z.string().trim().min(2).max(180),
  nivel: z.enum(["Fundamental", "Médio", "Superior"]),
  banca: z.string().trim().min(2).max(100),
  format: examFormatSchema,
  hours: z.number().min(0.5).max(12),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  disciplines: z.array(disciplineSchema).min(1).max(30),
  documentId: z.number().int().positive().nullable(),
}).strict().refine(s => s.disciplines.reduce((n, d) => n + d.topics.length, 0) <= 150, "Use até 150 tópicos por edital.");
export type GoalInput = z.infer<typeof goalInputSchema>;
export type PublicUser = { id: number; name: string; email: string; method: string };
export type AuthResponse = { user: PublicUser | null; csrfToken: string | null; googleEnabled: boolean };
export type Goal = Omit<GoalInput, "disciplines"> & { id: number; disciplines: DisciplineDraft[] };
export type TrailNode = {
  id: number; goalId: number; level: 1 | 2; position: number; subject: string; topic: string;
  completed: boolean; unlocked: boolean; questionCount: number;
};
export type QuestionChoice = { value: string; text: string };
export type StudyQuestion = {
  id: number; nodeId: number; subject: string; topic: string; board: string; format: ExamFormat;
  level: 1 | 2; difficulty: "Fácil" | "Médio" | "Difícil";
  prompt: string; choices: QuestionChoice[]; source: "ai" | "sample";
};
export type AnswerRationale = QuestionChoice & { correct: boolean; rationale: string };
export type AnswerFeedback = {
  questionId: number; value: string | null; correct: boolean; blank: boolean; correctAnswer: string;
  explanation: string; trap: string; rationales: AnswerRationale[];
  xpAwarded: number; nodeCompleted: boolean;
};
export type ErrorEntry = {
  questionId: number; nodeId: number; subject: string; topic: string; board: string; format: ExamFormat;
  prompt: string; errorCount: number; lastErrorAt: string;
};
export type StudyAnswer = { id: string; questionId: number; nodeId: number; subject: string; topic: string; correct: boolean; blank: boolean; createdAt: string };
export type StudySnapshot = {
  goal: Goal | null; nodes: TrailNode[]; errors: ErrorEntry[]; answers: StudyAnswer[];
  xp: number; streak: number; lastStudyDay: string;
  sound: boolean; dailyGoal: number; writing: string; scheduleRevision: number;
};
export type VerticalizationResponse = Syllabus & { documentId: number; source: "text" | "pdf" };
export type NodeQuestionsResponse = { node: TrailNode; questions: StudyQuestion[] };
export const answerInputSchema = z.object({
  questionId: z.number().int().positive(), value: z.string().max(10).nullable(),
  requestId: z.string().uuid(),
}).strict();
