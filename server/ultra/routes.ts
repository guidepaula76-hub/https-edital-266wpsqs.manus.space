import { asc, and, desc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type Express, type Response } from "express";
import { z } from "zod";
import pdfParse from "pdf-parse";
import {
  studyAnswers,
  studyDisciplines,
  studyDocuments,
  studyErrorEntries,
  studyGoals,
  studyNodes,
  studyPreferences,
  studyQuestions,
} from "../../drizzle/schema";
import { goalInputSchema, type ErrorEntry, type Goal, type StudyAnswer, type StudySnapshot, type TrailNode, type Syllabus } from "../../shared/ultra";
import { getDb } from "../db";
import { requireMutation, requireSession, type UltraRequest } from "./auth";
import { verticalizeSyllabus } from "./ai";

const textVerticalizationSchema = z.object({
  text: z.string().trim().min(20).max(120000),
  concurso: z.string().trim().min(2).max(180),
  cargo: z.string().trim().min(2).max(180),
}).strict();
const pdfVerticalizationSchema = z.object({
  name: z.string().trim().min(1).max(180),
  base64: z.string().min(1).max(11200000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  concurso: z.string().trim().min(2).max(180),
  cargo: z.string().trim().min(2).max(180),
}).strict();

async function saveVerticalizedDocument(input: {
  userId: number;
  name: string;
  source: "text" | "pdf";
  text: string;
  concurso: string;
  cargo: string;
  sizeBytes: number;
}): Promise<Syllabus & { documentId: number; source: "text" | "pdf" }> {
  const syllabus = await verticalizeSyllabus({
    text: input.text,
    concurso: input.concurso,
    cargo: input.cargo,
  });
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const inserted = await db.insert(studyDocuments).values({
    userId: input.userId,
    name: input.name,
    source: input.source,
    rawText: input.text,
    storageKey: null,
    sizeBytes: input.sizeBytes,
  }).$returningId();
  const documentId = inserted[0]?.id;
  if (!documentId) throw new Error("DOCUMENT_SAVE_FAILED");
  return { ...syllabus, documentId, source: input.source };
}

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

  router.post("/verticalize", requireMutation, async (req, res) => {
    const parsed = textVerticalizationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Informe o texto legível do edital, o concurso e o cargo.", code: "INVALID_INPUT" });
      return;
    }
    try {
      const result = await saveVerticalizedDocument({
        userId: userIdFrom(req as UltraRequest),
        name: "Edital colado",
        source: "text",
        text: parsed.data.text,
        concurso: parsed.data.concurso,
        cargo: parsed.data.cargo,
        sizeBytes: Buffer.byteLength(parsed.data.text, "utf8"),
      });
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "DOCUMENT_SAVE_FAILED") {
        res.status(503).json({ error: "Não foi possível guardar o documento organizado.", code: "DOCUMENT_SAVE_FAILED" });
        return;
      }
      sendStudyError(res, error);
    }
  });

  router.post("/verticalize-pdf", requireMutation, async (req, res) => {
    const parsed = pdfVerticalizationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Envie um arquivo PDF válido, com até 8 MiB, e informe o concurso e o cargo.", code: "INVALID_INPUT" });
      return;
    }
    try {
      const buffer = Buffer.from(parsed.data.base64, "base64");
      if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        res.status(400).json({ error: "O arquivo enviado não é um PDF válido ou ultrapassa 8 MiB.", code: "INVALID_PDF" });
        return;
      }
      const extracted = await pdfParse(buffer);
      const text = extracted.text.replace(/\u0000/g, "").trim();
      if (text.length < 20) {
        res.status(422).json({ error: "Este PDF não contém texto legível. Se for digitalizado como imagem, cole o conteúdo textual do edital.", code: "PDF_TEXT_UNAVAILABLE" });
        return;
      }
      if (text.length > 120000) {
        res.status(413).json({ error: "O texto extraído ultrapassa o limite de 120 mil caracteres. Envie um trecho menor do edital.", code: "TEXT_TOO_LARGE" });
        return;
      }
      const result = await saveVerticalizedDocument({
        userId: userIdFrom(req as UltraRequest),
        name: parsed.data.name,
        source: "pdf",
        text,
        concurso: parsed.data.concurso,
        cargo: parsed.data.cargo,
        sizeBytes: buffer.length,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid PDF structure") {
        res.status(422).json({ error: "Não foi possível ler este PDF. Tente outro arquivo ou cole o texto do edital.", code: "PDF_PARSE_FAILED" });
        return;
      }
      sendStudyError(res, error);
    }
  });

  router.post("/goals", requireMutation, async (req, res) => {
    const parsed = goalInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Confira os dados da meta e do edital.", code: "INVALID_INPUT" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "O banco de dados ainda não está disponível.", code: "DATABASE_UNAVAILABLE" });
        return;
      }
      const userId = userIdFrom(req as UltraRequest);
      const goalId = await db.transaction(async tx => {
        if (parsed.data.documentId !== null) {
          const ownedDocument = await tx.select({ id: studyDocuments.id }).from(studyDocuments)
            .where(and(eq(studyDocuments.id, parsed.data.documentId), eq(studyDocuments.userId, userId))).limit(1);
          if (!ownedDocument[0]) throw new Error("DOCUMENT_NOT_OWNED");
        }
        const insertedGoal = await tx.insert(studyGoals).values({
          userId,
          documentId: parsed.data.documentId,
          concurso: parsed.data.concurso,
          cargo: parsed.data.cargo,
          nivel: parsed.data.nivel,
          banca: parsed.data.banca,
          format: parsed.data.format,
          hours: parsed.data.hours,
          examDate: parsed.data.examDate,
        }).$returningId();
        const newGoalId = insertedGoal[0]?.id;
        if (!newGoalId) throw new Error("GOAL_SAVE_FAILED");

        const nodesToInsert: Array<typeof studyNodes.$inferInsert> = [];
        let positionByLevel: Record<1 | 2, number> = { 1: 0, 2: 0 };
        for (let disciplinePosition = 0; disciplinePosition < parsed.data.disciplines.length; disciplinePosition++) {
          const disciplineDraft = parsed.data.disciplines[disciplinePosition];
          const insertedDiscipline = await tx.insert(studyDisciplines).values({
            userId,
            goalId: newGoalId,
            position: disciplinePosition,
            name: disciplineDraft.name,
          }).$returningId();
          const disciplineId = insertedDiscipline[0]?.id;
          if (!disciplineId) throw new Error("DISCIPLINE_SAVE_FAILED");
          for (let topicPosition = 0; topicPosition < disciplineDraft.topics.length; topicPosition++) {
            const topic = disciplineDraft.topics[topicPosition];
            for (const level of [1, 2] as const) {
              nodesToInsert.push({
                userId,
                goalId: newGoalId,
                disciplineId,
                level,
                position: positionByLevel[level]++,
                topicPosition,
                subject: disciplineDraft.name,
                topic,
              });
            }
          }
        }
        if (nodesToInsert.length) await tx.insert(studyNodes).values(nodesToInsert);
        await tx.insert(studyPreferences).values({ userId, activeGoalId: newGoalId })
          .onDuplicateKeyUpdate({ set: { activeGoalId: newGoalId } });
        return newGoalId;
      });
      res.status(201).json({ goalId });
    } catch (error) {
      if (error instanceof Error && error.message === "DOCUMENT_NOT_OWNED") {
        res.status(404).json({ error: "O documento do edital não pertence a esta conta.", code: "DOCUMENT_NOT_FOUND" });
        return;
      }
      sendStudyError(res, error);
    }
  });

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
