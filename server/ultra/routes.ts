import { asc, and, desc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type Express, type Response } from "express";
import { z } from "zod";
import {
  studyAnswers,
  studyDisciplines,
  studyErrorEntries,
  studyGoals,
  studyNodes,
  studyPreferences,
  studyQuestions,
} from "../../drizzle/schema";
import type { ErrorEntry, Goal, StudyAnswer, StudySnapshot, TrailNode } from "../../shared/ultra";
import { getDb } from "../db";
import { requireMutation, requireSession, type UltraRequest } from "./auth";

const preferencesSchema = z.object({
  sound: z.boolean().optional(),
  writing: z.string().max(20000).optional(),
  dailyGoal: z.number().int().min(1).max(1000).optional(),
  scheduleRevision: z.number().int().min(0).max(1000000).optional(),
}).strict().refine(value => Object.keys(value).length > 0, "Informe ao menos uma preferência.");

function userIdFrom(req: UltraRequest): number {
  if (!req.ultra?.user.id) throw new Error("Authenticated user context is missing");
  return req.ultra.user.id;
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buildTrailNodes(rows: Array<typeof studyNodes.$inferSelect>, questionCounts: Map<number, number>): TrailNode[] {
  const levelOne = rows.filter(row => row.level === 1).sort((a, b) => a.position - b.position);
  const levelTwo = rows.filter(row => row.level === 2).sort((a, b) => a.position - b.position);
  const levelOneComplete = levelOne.every(row => Boolean(row.completedAt));
  const isUnlocked = (row: typeof studyNodes.$inferSelect) => {
    const group = row.level === 1 ? levelOne : levelTwo;
    const index = group.findIndex(item => item.id === row.id);
    if (row.level === 2 && !levelOneComplete) return false;
    return index === 0 || group.slice(0, index).every(item => Boolean(item.completedAt));
  };
  return [...levelOne, ...levelTwo].map(row => ({
    id: row.id,
    goalId: row.goalId,
    level: row.level === 2 ? 2 : 1,
    position: row.position,
    subject: row.subject,
    topic: row.topic,
    completed: Boolean(row.completedAt),
    unlocked: isUnlocked(row),
    questionCount: questionCounts.get(row.id) ?? 0,
  }));
}

function buildGoal(
  row: typeof studyGoals.$inferSelect,
  disciplines: Array<typeof studyDisciplines.$inferSelect>,
  nodes: Array<typeof studyNodes.$inferSelect>,
): Goal {
  return {
    id: row.id,
    documentId: row.documentId ?? null,
    concurso: row.concurso,
    cargo: row.cargo,
    nivel: row.nivel,
    banca: row.banca,
    format: row.format,
    hours: row.hours,
    examDate: row.examDate,
    disciplines: disciplines.sort((a, b) => a.position - b.position).map(discipline => ({
      name: discipline.name,
      topics: nodes
        .filter(node => node.disciplineId === discipline.id && node.level === 1)
        .sort((a, b) => a.topicPosition - b.topicPosition)
        .map(node => node.topic),
    })),
  };
}

async function loadSnapshot(userId: number): Promise<StudySnapshot> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const [preferenceRows, answerRows, errorRows] = await Promise.all([
    db.select().from(studyPreferences).where(eq(studyPreferences.userId, userId)).limit(1),
    db.select().from(studyAnswers).where(eq(studyAnswers.userId, userId)).orderBy(desc(studyAnswers.createdAt)).limit(200),
    db.select().from(studyErrorEntries).where(and(eq(studyErrorEntries.userId, userId), isNull(studyErrorEntries.resolvedAt))).orderBy(desc(studyErrorEntries.lastErrorAt)).limit(200),
  ]);
  const preferences = preferenceRows[0];
  const activeGoalId = preferences?.activeGoalId ?? null;

  let goal: Goal | null = null;
  let nodeRows: Array<typeof studyNodes.$inferSelect> = [];
  let questionRows: Array<typeof studyQuestions.$inferSelect> = [];
  if (activeGoalId) {
    const [goalRows, disciplineRows, activeNodes, activeQuestions] = await Promise.all([
      db.select().from(studyGoals).where(and(eq(studyGoals.id, activeGoalId), eq(studyGoals.userId, userId))).limit(1),
      db.select().from(studyDisciplines).where(and(eq(studyDisciplines.goalId, activeGoalId), eq(studyDisciplines.userId, userId))).orderBy(asc(studyDisciplines.position)),
      db.select().from(studyNodes).where(and(eq(studyNodes.goalId, activeGoalId), eq(studyNodes.userId, userId))).orderBy(asc(studyNodes.level), asc(studyNodes.position)),
      db.select().from(studyQuestions).where(and(eq(studyQuestions.goalId, activeGoalId), eq(studyQuestions.userId, userId))),
    ]);
    const activeGoal = goalRows[0];
    if (activeGoal) {
      goal = buildGoal(activeGoal, disciplineRows, activeNodes);
      nodeRows = activeNodes;
      questionRows = activeQuestions;
    }
  }

  const questionCounts = new Map<number, number>();
  for (const question of questionRows) questionCounts.set(question.nodeId, (questionCounts.get(question.nodeId) ?? 0) + 1);

  const errorQuestionIds = [...new Set(errorRows.map(row => row.questionId))];
  const errorQuestions = errorQuestionIds.length
    ? await db.select().from(studyQuestions).where(and(eq(studyQuestions.userId, userId), inArray(studyQuestions.id, errorQuestionIds)))
    : [];
  const questionById = new Map(errorQuestions.map(question => [question.id, question]));
  const errors: ErrorEntry[] = errorRows.flatMap(row => {
    const question = questionById.get(row.questionId);
    return question ? [{
      questionId: question.id,
      nodeId: row.nodeId,
      subject: question.subject,
      topic: question.topic,
      board: question.board,
      format: question.format,
      prompt: question.prompt,
      errorCount: row.errorCount,
      lastErrorAt: toIso(row.lastErrorAt),
    }] : [];
  });

  const answers: StudyAnswer[] = answerRows.map(row => ({
    id: String(row.id),
    questionId: row.questionId,
    nodeId: row.nodeId,
    subject: row.subject,
    topic: row.topic,
    correct: row.correct,
    blank: row.blank,
    createdAt: toIso(row.createdAt),
  }));

  return {
    goal,
    nodes: buildTrailNodes(nodeRows, questionCounts),
    errors,
    answers,
    xp: preferences?.xp ?? 0,
    streak: preferences?.streak ?? 0,
    lastStudyDay: preferences?.lastStudyDay ?? "",
    sound: preferences?.sound ?? false,
    dailyGoal: preferences?.dailyGoal ?? 50,
    writing: preferences?.writing ?? "",
    scheduleRevision: preferences?.scheduleRevision ?? 0,
  };
}

function sendStudyError(res: Response, error: unknown) {
  if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") {
    res.status(503).json({ error: "O banco de dados ainda não está disponível.", code: "DATABASE_UNAVAILABLE" });
    return;
  }
  console.error("[Study API] Request failed", error instanceof Error ? error.name : "unknown");
  res.status(503).json({ error: "Não foi possível carregar seus estudos agora. Tente novamente.", code: "STUDY_UNAVAILABLE" });
}

export function createStudyRouter() {
  const router = Router();

  router.get("/snapshot", requireSession, async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      res.json(await loadSnapshot(userIdFrom(req as UltraRequest)));
    } catch (error) {
      sendStudyError(res, error);
    }
  });

  router.patch("/preferences", requireMutation, async (req, res) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Preferências inválidas.", code: "INVALID_INPUT" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "O banco de dados ainda não está disponível.", code: "DATABASE_UNAVAILABLE" });
        return;
      }
      const userId = userIdFrom(req as UltraRequest);
      await db.insert(studyPreferences).values({ userId, ...parsed.data }).onDuplicateKeyUpdate({ set: parsed.data });
      res.json({ success: true });
    } catch (error) {
      sendStudyError(res, error);
    }
  });

  return router;
}

export function registerStudyRoutes(app: Express) {
  app.use("/api/study", createStudyRouter());
}
