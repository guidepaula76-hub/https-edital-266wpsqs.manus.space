import { createHash, randomUUID } from "node:crypto";
import { asc, and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { Router, type Express, type Response } from "express";
import { z } from "zod";
import pdfParse from "pdf-parse";
import {
  studyAnswers,
  studyDisciplines,
  studyDocuments,
  studyErrorEntries,
  studyGoals,
  studyDailyUsage,
  studyNodes,
  studyPreferences,
  studyQuestions,
  studyQuestionRewards,
} from "../../drizzle/schema";
import { answerInputSchema, goalInputSchema, type AnswerFeedback, type ErrorEntry, type Goal, type StudyAnswer, type StudyQuestion, type StudySnapshot, type TrailNode, type Syllabus } from "../../shared/ultra";
import { getDb } from "../db";
import { requireMutation, requireSession, type UltraRequest } from "./auth";
import { generateNodeQuestions, verticalizeSyllabus } from "./ai";
import { canGenerateQuestionBatch, FREE_DAILY_NEW_QUESTION_LIMIT, getSaoPauloDayKey, NEW_QUESTION_BATCH_SIZE } from "./quotas";
import { storageGetSignedUrl, storagePut } from "../storage";

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
  fileBuffer?: Buffer;
}): Promise<Syllabus & { documentId: number; source: "text" | "pdf" }> {
  const syllabus = await verticalizeSyllabus({
    text: input.text,
    concurso: input.concurso,
    cargo: input.cargo,
  });
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  if (input.source === "pdf" && !input.fileBuffer?.length) throw new Error("PDF_FILE_MISSING");
  const storedFile = input.source === "pdf"
    ? await storagePut(`ultra-study-documents/${input.userId}/${randomUUID()}.pdf`, input.fileBuffer!, "application/pdf")
    : null;
  const inserted = await db.insert(studyDocuments).values({
    userId: input.userId,
    name: input.name,
    source: input.source,
    rawText: input.text,
    storageKey: storedFile?.key ?? null,
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

function publicQuestion(row: typeof studyQuestions.$inferSelect): StudyQuestion {
  return {
    id: row.id,
    nodeId: row.nodeId,
    subject: row.subject,
    topic: row.topic,
    board: row.board,
    format: row.format,
    level: row.level === 2 ? 2 : 1,
    difficulty: row.difficulty,
    prompt: row.prompt,
    choices: row.choices,
    source: row.source,
  };
}

function promptHash(prompt: string): string {
  return createHash("sha256").update(prompt.trim().toLocaleLowerCase("pt-BR")).digest("hex");
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
        fileBuffer: buffer,
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

  router.get("/documents/:id/download", requireSession, async (req, res) => {
    const documentId = Number(req.params.id);
    if (!Number.isSafeInteger(documentId) || documentId < 1) {
      res.status(400).json({ error: "Documento inválido.", code: "INVALID_DOCUMENT" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) throw new Error("DATABASE_UNAVAILABLE");
      const userId = userIdFrom(req as UltraRequest);
      const rows = await db.select().from(studyDocuments)
        .where(and(eq(studyDocuments.id, documentId), eq(studyDocuments.userId, userId)))
        .limit(1);
      const document = rows[0];
      if (!document || document.source !== "pdf" || !document.storageKey) {
        res.status(404).json({ error: "PDF não encontrado nesta conta.", code: "DOCUMENT_NOT_FOUND" });
        return;
      }
      const signedUrl = await storageGetSignedUrl(document.storageKey);
      const target = new URL(signedUrl);
      if (target.protocol !== "https:") {
        res.status(502).json({ error: "O armazenamento retornou um endereço inválido.", code: "STORAGE_URL_INVALID" });
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.redirect(302, signedUrl);
    } catch (error) {
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

  router.get("/nodes/:id/questions", requireSession, async (req, res) => {
    const nodeId = Number(req.params.id);
    if (!Number.isSafeInteger(nodeId) || nodeId < 1) {
      res.status(400).json({ error: "Nó de estudo inválido.", code: "INVALID_NODE" });
      return;
    }
    try {
      const userId = userIdFrom(req as UltraRequest);
      const snapshot = await loadSnapshot(userId);
      const node = snapshot.nodes.find(item => item.id === nodeId);
      if (!node) {
        res.status(404).json({ error: "Nó não encontrado na sua meta ativa.", code: "NODE_NOT_FOUND" });
        return;
      }
      if (!node.unlocked) {
        res.status(403).json({ error: "Conclua as etapas anteriores para liberar este nó.", code: "NODE_LOCKED" });
        return;
      }
      const db = await getDb();
      if (!db || !snapshot.goal) throw new Error("DATABASE_UNAVAILABLE");
      const rows = await db.select().from(studyQuestions)
        .where(and(
          eq(studyQuestions.userId, userId),
          eq(studyQuestions.goalId, snapshot.goal.id),
          eq(studyQuestions.nodeId, nodeId),
        ))
        .orderBy(asc(studyQuestions.createdAt), asc(studyQuestions.id));
      res.json({ node, questions: rows.map(publicQuestion) });
    } catch (error) {
      sendStudyError(res, error);
    }
  });

  router.post("/nodes/:id/generate", requireMutation, async (req, res) => {
    const nodeId = Number(req.params.id);
    if (!Number.isSafeInteger(nodeId) || nodeId < 1) {
      res.status(400).json({ error: "Nó de estudo inválido.", code: "INVALID_NODE" });
      return;
    }
    const generationId = randomUUID();
    const now = new Date();
    try {
      const userId = userIdFrom(req as UltraRequest);
      const snapshot = await loadSnapshot(userId);
      const node = snapshot.nodes.find(item => item.id === nodeId);
      if (!node) {
        res.status(404).json({ error: "Nó não encontrado na sua meta ativa.", code: "NODE_NOT_FOUND" });
        return;
      }
      if (!node.unlocked) {
        res.status(403).json({ error: "Conclua as etapas anteriores para liberar este nó.", code: "NODE_LOCKED" });
        return;
      }
      const db = await getDb();
      if (!db || !snapshot.goal) throw new Error("DATABASE_UNAVAILABLE");
      const lockResult = await db.update(studyNodes).set({
        generationLockId: generationId,
        generationLockExpiresAt: new Date(now.getTime() + 3 * 60 * 1000),
      }).where(and(
        eq(studyNodes.id, nodeId),
        eq(studyNodes.userId, userId),
        or(isNull(studyNodes.generationLockExpiresAt), lt(studyNodes.generationLockExpiresAt, now)),
      ));
      const affectedRows = Number((lockResult as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
      if (affectedRows < 1) {
        res.status(409).json({ error: "Já existe uma geração de questões em andamento para este tópico. Aguarde um instante.", code: "GENERATION_IN_PROGRESS" });
        return;
      }
      try {
        // Fast pre-check avoids unnecessary AI calls; the transaction below is authoritative.
        const today = getSaoPauloDayKey();
        const currentUsage = await db.select({ questionGenerations: studyDailyUsage.questionGenerations })
          .from(studyDailyUsage)
          .where(and(eq(studyDailyUsage.userId, userId), eq(studyDailyUsage.day, today)))
          .limit(1);
        const usedBeforeGeneration = currentUsage[0]?.questionGenerations ?? 0;
        if (usedBeforeGeneration >= FREE_DAILY_NEW_QUESTION_LIMIT) {
          res.status(429).json({
            error: "Você atingiu o limite gratuito de 10 questões novas hoje. As revisões continuam liberadas.",
            code: "DAILY_QUESTION_LIMIT",
            usage: { used: usedBeforeGeneration, limit: FREE_DAILY_NEW_QUESTION_LIMIT, remaining: Math.max(0, FREE_DAILY_NEW_QUESTION_LIMIT - usedBeforeGeneration) },
          });
          return;
        }
        const batchSize = Math.min(NEW_QUESTION_BATCH_SIZE, FREE_DAILY_NEW_QUESTION_LIMIT - usedBeforeGeneration) as 1 | 2 | 3;
        const generated = await generateNodeQuestions({
          subject: node.subject,
          topic: node.topic,
          board: snapshot.goal.banca,
          format: snapshot.goal.format,
          level: node.level,
          questionCount: batchSize,
        });
        const existingRows = await db.select({ promptHash: studyQuestions.promptHash }).from(studyQuestions)
          .where(and(eq(studyQuestions.userId, userId), eq(studyQuestions.nodeId, nodeId)));
        const existingHashes = new Set(existingRows.map(row => row.promptHash));
        const unique = generated.filter(question => {
          const hash = promptHash(question.prompt);
          if (existingHashes.has(hash)) return false;
          existingHashes.add(hash);
          return true;
        });
        if (unique.length !== batchSize) {
          res.status(409).json({ error: "A IA repetiu uma questão já existente. Tente gerar novamente em instantes.", code: "DUPLICATE_QUESTIONS" });
          return;
        }
        const insertRows = unique.map(question => ({
          userId,
          goalId: snapshot.goal!.id,
          nodeId,
          subject: node.subject,
          topic: node.topic,
          board: snapshot.goal!.banca,
          format: snapshot.goal!.format,
          level: node.level,
          difficulty: question.difficulty,
          prompt: question.prompt,
          promptHash: promptHash(question.prompt),
          choices: question.choices,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          trap: question.trap,
          rationales: question.rationales,
          source: "ai" as const,
          generationId,
        }));
        // Reserve quota and persist the whole batch atomically. Until a verified
        // Pro entitlement exists, every account follows the Free allowance.
        const quotaResult = await db.transaction(async tx => {
          await tx.insert(studyDailyUsage).values({
            userId,
            day: today,
            verticalizations: 0,
            questionGenerations: 0,
          }).onDuplicateKeyUpdate({ set: { day: today } });
          const usageRows = await tx.select().from(studyDailyUsage)
            .where(and(eq(studyDailyUsage.userId, userId), eq(studyDailyUsage.day, today)))
            .limit(1)
            .for("update");
          const used = usageRows[0]?.questionGenerations ?? 0;
          if (!canGenerateQuestionBatch(used, batchSize)) return { allowed: false, used, inserted: [] as Array<{ id: number }> };
          const inserted = await tx.insert(studyQuestions).values(insertRows).$returningId();
          if (inserted.length !== batchSize) throw new Error("QUESTION_SAVE_FAILED");
          await tx.update(studyDailyUsage).set({
            questionGenerations: used + insertRows.length,
          }).where(and(eq(studyDailyUsage.userId, userId), eq(studyDailyUsage.day, today)));
          return { allowed: true, used: used + inserted.length, inserted };
        });
        if (!quotaResult.allowed) {
          res.status(429).json({
            error: "Você atingiu o limite gratuito de 10 questões novas hoje. As revisões continuam liberadas.",
            code: "DAILY_QUESTION_LIMIT",
            usage: { used: quotaResult.used, limit: FREE_DAILY_NEW_QUESTION_LIMIT, remaining: Math.max(0, FREE_DAILY_NEW_QUESTION_LIMIT - quotaResult.used) },
          });
          return;
        }
        if (quotaResult.inserted.length !== NEW_QUESTION_BATCH_SIZE) throw new Error("QUESTION_SAVE_FAILED");
        const rows = await db.select().from(studyQuestions)
          .where(and(eq(studyQuestions.userId, userId), eq(studyQuestions.generationId, generationId)))
          .orderBy(asc(studyQuestions.id));
        const updatedNode = { ...node, questionCount: node.questionCount + rows.length };
        res.status(201).json({
          node: updatedNode,
          questions: rows.map(publicQuestion),
          usage: {
            used: quotaResult.used,
            limit: FREE_DAILY_NEW_QUESTION_LIMIT,
            remaining: Math.max(0, FREE_DAILY_NEW_QUESTION_LIMIT - quotaResult.used),
          },
          notice: "Questões geradas por IA, não oficiais. Confira a legislação e o edital vigentes.",
        });
      } finally {
        await db.update(studyNodes).set({
          generationLockId: null,
          generationLockExpiresAt: null,
        }).where(and(eq(studyNodes.id, nodeId), eq(studyNodes.userId, userId), eq(studyNodes.generationLockId, generationId)));
      }
    } catch (error) {
      sendStudyError(res, error);
    }
  });

  router.get("/questions/:id", requireSession, async (req, res) => {
    const questionId = Number(req.params.id);
    if (!Number.isSafeInteger(questionId) || questionId < 1) {
      res.status(400).json({ error: "Questão inválida.", code: "INVALID_QUESTION" });
      return;
    }
    try {
      const userId = userIdFrom(req as UltraRequest);
      const db = await getDb();
      if (!db) throw new Error("DATABASE_UNAVAILABLE");
      const rows = await db.select().from(studyQuestions)
        .where(and(eq(studyQuestions.id, questionId), eq(studyQuestions.userId, userId))).limit(1);
      const question = rows[0];
      if (!question) {
        res.status(404).json({ error: "Questão não encontrada.", code: "QUESTION_NOT_FOUND" });
        return;
      }
      const [preferenceRows, errorRows] = await Promise.all([
        db.select({ activeGoalId: studyPreferences.activeGoalId }).from(studyPreferences).where(eq(studyPreferences.userId, userId)).limit(1),
        db.select({ id: studyErrorEntries.id }).from(studyErrorEntries)
          .where(and(eq(studyErrorEntries.userId, userId), eq(studyErrorEntries.questionId, questionId))).limit(1),
      ]);
      if (preferenceRows[0]?.activeGoalId !== question.goalId && !errorRows[0]) {
        res.status(404).json({ error: "Questão não encontrada na sua jornada ativa.", code: "QUESTION_NOT_FOUND" });
        return;
      }
      res.json(publicQuestion(question));
    } catch (error) {
      sendStudyError(res, error);
    }
  });


  router.post("/answers", requireMutation, async (req, res) => {
    const parsed = answerInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Informe uma questão, uma resposta válida e um identificador de tentativa.", code: "INVALID_INPUT" });
      return;
    }

    try {
      const userId = userIdFrom(req as UltraRequest);
      const db = await getDb();
      if (!db) throw new Error("DATABASE_UNAVAILABLE");

      // Repetir a mesma requisição (por exemplo, após falha de rede) devolve
      // exatamente o resultado anterior, sem somar XP ou duplicar o histórico.
      const previousAttempt = await db.select().from(studyAnswers)
        .where(and(eq(studyAnswers.userId, userId), eq(studyAnswers.requestId, parsed.data.requestId)))
        .limit(1);
      if (previousAttempt[0]) {
        // Uma chave de idempotência identifica a tentativa e seu conteúdo.
        // Não permitir que a mesma chave reapresente outra questão ou resposta.
        if (previousAttempt[0].questionId !== parsed.data.questionId || previousAttempt[0].value !== parsed.data.value) {
          res.status(409).json({ error: "Este identificador de tentativa já foi usado com outra questão ou resposta.", code: "IDEMPOTENCY_KEY_REUSED" });
          return;
        }
        const [questionRows] = await Promise.all([
          db.select().from(studyQuestions)
            .where(and(eq(studyQuestions.id, previousAttempt[0].questionId), eq(studyQuestions.userId, userId)))
            .limit(1),
        ]);
        const question = questionRows[0];
        if (!question) {
          res.status(404).json({ error: "Questão não encontrada.", code: "QUESTION_NOT_FOUND" });
          return;
        }
        const feedback: AnswerFeedback = {
          questionId: question.id,
          value: previousAttempt[0].value,
          correct: previousAttempt[0].correct,
          blank: previousAttempt[0].blank,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          trap: question.trap,
          rationales: question.rationales,
          xpAwarded: previousAttempt[0].xpAwarded,
          nodeCompleted: previousAttempt[0].nodeCompleted,
        };
        res.json(feedback);
        return;
      }

      const [questionRows, preferenceRows, errorRows] = await Promise.all([
        db.select().from(studyQuestions)
          .where(and(eq(studyQuestions.id, parsed.data.questionId), eq(studyQuestions.userId, userId)))
          .limit(1),
        db.select().from(studyPreferences)
          .where(eq(studyPreferences.userId, userId)).limit(1),
        db.select({ id: studyErrorEntries.id }).from(studyErrorEntries)
          .where(and(eq(studyErrorEntries.userId, userId), eq(studyErrorEntries.questionId, parsed.data.questionId), isNull(studyErrorEntries.resolvedAt))).limit(1),
      ]);
      const question = questionRows[0];
      const preferences = preferenceRows[0];
      const isPendingErrorReview = Boolean(errorRows[0]);
      if (!question || !preferences || (preferences.activeGoalId !== question.goalId && !isPendingErrorReview)) {
        res.status(404).json({ error: "Questão não encontrada na sua meta ativa ou no caderno de erros.", code: "QUESTION_NOT_FOUND" });
        return;
      }

      const nodeRows = await db.select().from(studyNodes)
        .where(and(
          eq(studyNodes.id, question.nodeId),
          eq(studyNodes.userId, userId),
          eq(studyNodes.goalId, question.goalId),
        )).limit(1);
      const node = nodeRows[0];
      if (!node) {
        res.status(404).json({ error: "Etapa não encontrada.", code: "NODE_NOT_FOUND" });
        return;
      }
      if (!isPendingErrorReview) {
        const activeNodes = await db.select().from(studyNodes)
          .where(and(eq(studyNodes.userId, userId), eq(studyNodes.goalId, question.goalId)))
          .orderBy(asc(studyNodes.level), asc(studyNodes.position));
        const nodeState = buildTrailNodes(activeNodes, new Map()).find(item => item.id === node.id);
        if (!nodeState?.unlocked) {
          res.status(403).json({ error: "Conclua as etapas anteriores para liberar esta questão.", code: "NODE_LOCKED" });
          return;
        }
      }

      const blank = parsed.data.value === null;
      if (blank && question.format !== "CE") {
        res.status(400).json({ error: "Deixar em branco só é permitido no formato Certo/Errado.", code: "BLANK_NOT_ALLOWED" });
        return;
      }
      if (!blank && !question.choices.some(choice => choice.value === parsed.data.value)) {
        res.status(400).json({ error: "A alternativa informada não pertence a esta questão.", code: "INVALID_ANSWER" });
        return;
      }

      const correct = !blank && parsed.data.value === question.correctAnswer;
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());
      const yesterdayDate = new Date(`${today}T12:00:00-03:00`);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(yesterdayDate);

      const feedback = await db.transaction(async tx => {
        // Serializa as respostas desta conta. Isso evita que duas tentativas
        // simultâneas leiam o mesmo XP/ofensiva e sobrescrevam uma à outra,
        // além de tornar a verificação do requestId e da recompensa atômica
        // em relação às demais respostas do mesmo usuário.
        const lockedPreferenceRows = await tx.select().from(studyPreferences)
          .where(eq(studyPreferences.userId, userId))
          .limit(1)
          .for("update");
        const currentPreferences = lockedPreferenceRows[0];
        if (!currentPreferences) throw new Error("PREFERENCES_NOT_FOUND");

        const retryRows = await tx.select().from(studyAnswers)
          .where(and(eq(studyAnswers.userId, userId), eq(studyAnswers.requestId, parsed.data.requestId)))
          .limit(1);
        if (retryRows[0]) {
          if (retryRows[0].questionId !== parsed.data.questionId || retryRows[0].value !== parsed.data.value) {
            throw new Error("IDEMPOTENCY_KEY_REUSED");
          }
          return {
            questionId: question.id,
            value: retryRows[0].value,
            correct: retryRows[0].correct,
            blank: retryRows[0].blank,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            trap: question.trap,
            rationales: question.rationales,
            xpAwarded: retryRows[0].xpAwarded,
            nodeCompleted: retryRows[0].nodeCompleted,
          } satisfies AnswerFeedback;
        }

        let xpAwarded = 0;
        if (correct) {
          const existingReward = await tx.select({ id: studyQuestionRewards.id })
            .from(studyQuestionRewards)
            .where(and(
              eq(studyQuestionRewards.userId, userId),
              eq(studyQuestionRewards.questionId, question.id),
            )).limit(1);
          if (!existingReward[0]) {
            await tx.insert(studyQuestionRewards).values({ userId, questionId: question.id });
            // Pontuação fixa do produto: 10 XP pelo primeiro acerto de cada questão.
            xpAwarded = 10;
          }
        }

        await tx.insert(studyAnswers).values({
          userId,
          questionId: question.id,
          nodeId: node.id,
          subject: question.subject,
          topic: question.topic,
          requestId: parsed.data.requestId,
          value: parsed.data.value,
          correct,
          blank,
          xpAwarded,
          nodeCompleted: false,
        });

        if (!blank && !correct) {
          const existingError = await tx.select().from(studyErrorEntries)
            .where(and(
              eq(studyErrorEntries.userId, userId),
              eq(studyErrorEntries.questionId, question.id),
            )).limit(1);
          if (existingError[0]) {
            await tx.update(studyErrorEntries).set({
              errorCount: existingError[0].errorCount + 1,
              lastErrorAt: new Date(),
              resolvedAt: null,
            }).where(eq(studyErrorEntries.id, existingError[0].id));
          } else {
            await tx.insert(studyErrorEntries).values({
              userId, questionId: question.id, nodeId: node.id, errorCount: 1,
            });
          }
        } else if (correct) {
          await tx.update(studyErrorEntries).set({ resolvedAt: new Date() }).where(and(
            eq(studyErrorEntries.userId, userId),
            eq(studyErrorEntries.questionId, question.id),
            isNull(studyErrorEntries.resolvedAt),
          ));
        }

        const nodeAttempts = await tx.select().from(studyAnswers)
          .where(and(eq(studyAnswers.userId, userId), eq(studyAnswers.nodeId, node.id)));
        const distinctAnswered = new Map<number, boolean>();
        for (const attempt of nodeAttempts) {
          distinctAnswered.set(attempt.questionId, Boolean(distinctAnswered.get(attempt.questionId)) || attempt.correct);
        }
        const answeredCount = distinctAnswered.size;
        const correctCount = [...distinctAnswered.values()].filter(Boolean).length;
        const nodeCompleted = answeredCount >= 3 && correctCount >= 2 && !node.completedAt;
        if (nodeCompleted) {
          await tx.update(studyNodes).set({ completedAt: new Date() }).where(and(
            eq(studyNodes.id, node.id),
            eq(studyNodes.userId, userId),
            isNull(studyNodes.completedAt),
          ));
        }

        const lastStudyDay = currentPreferences.lastStudyDay ?? "";
        const nextStreak = lastStudyDay === today
          ? currentPreferences.streak
          : lastStudyDay === yesterday
            ? currentPreferences.streak + 1
            : 1;
        await tx.update(studyPreferences).set({
          xp: currentPreferences.xp + xpAwarded,
          streak: nextStreak,
          lastStudyDay: today,
        }).where(eq(studyPreferences.userId, userId));

        await tx.update(studyAnswers).set({ nodeCompleted }).where(and(
          eq(studyAnswers.userId, userId),
          eq(studyAnswers.requestId, parsed.data.requestId),
        ));

        return {
          questionId: question.id,
          value: parsed.data.value,
          correct,
          blank,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          trap: question.trap,
          rationales: question.rationales,
          xpAwarded,
          nodeCompleted,
        } satisfies AnswerFeedback;
      });

      res.json(feedback);
    } catch (error) {
      if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_REUSED") {
        res.status(409).json({ error: "Este identificador de tentativa já foi usado com outra questão ou resposta.", code: "IDEMPOTENCY_KEY_REUSED" });
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
