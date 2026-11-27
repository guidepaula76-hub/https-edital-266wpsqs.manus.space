import {
  boolean,
  double,
  foreignKey,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import type {
  AnswerRationale,
  ExamFormat,
  QuestionChoice,
} from "../shared/ultra";
import { users } from "./baseSchema";

/** User-owned source file/text from a successful edital verticalization preview. */
export const studyDocuments = mysqlTable(
  "ultra_study_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    source: mysqlEnum("source", ["text", "pdf"]).notNull(),
    rawText: mediumtext("rawText").notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    sizeBytes: int("sizeBytes").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("ultra_study_documents_user_created_idx").on(table.userId, table.createdAt)],
);

/** Each created goal is preserved; the active version is selected in studyPreferences. */
export const studyGoals = mysqlTable(
  "ultra_study_goals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    documentId: int("documentId").references(() => studyDocuments.id, { onDelete: "set null" }),
    concurso: varchar("concurso", { length: 180 }).notNull(),
    cargo: varchar("cargo", { length: 180 }).notNull(),
    nivel: mysqlEnum("nivel", ["Fundamental", "Médio", "Superior"]).notNull(),
    banca: varchar("banca", { length: 100 }).notNull(),
    format: mysqlEnum("format", ["CE", "AD", "AE"]).$type<ExamFormat>().notNull(),
    hours: double("hours").notNull(),
    examDate: varchar("examDate", { length: 10 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("ultra_study_goals_user_created_idx").on(table.userId, table.createdAt)],
);

/** Durable user preferences and server-owned progress counters. */
export const studyPreferences = mysqlTable("ultra_study_preferences", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  activeGoalId: int("activeGoalId").references(() => studyGoals.id, { onDelete: "set null" }),
  sound: boolean("sound").default(false).notNull(),
  dailyGoal: int("dailyGoal").default(50).notNull(),
  writing: text("writing").notNull().default(""),
  scheduleRevision: int("scheduleRevision").default(0).notNull(),
  xp: int("xp").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  lastStudyDay: varchar("lastStudyDay", { length: 10 }).notNull().default(""),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const studyDisciplines = mysqlTable(
  "ultra_study_disciplines",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    goalId: int("goalId").notNull().references(() => studyGoals.id, { onDelete: "cascade" }),
    position: int("position").notNull(),
    name: varchar("name", { length: 140 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_disciplines_goal_position_uq").on(table.userId, table.goalId, table.position),
    index("ultra_study_disciplines_goal_idx").on(table.userId, table.goalId),
  ],
);

/** One ordered node per confirmed topic at each level. */
export const studyNodes = mysqlTable(
  "ultra_study_nodes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    goalId: int("goalId").notNull().references(() => studyGoals.id, { onDelete: "cascade" }),
    disciplineId: int("disciplineId").notNull().references(() => studyDisciplines.id, { onDelete: "cascade" }),
    level: int("level").notNull(),
    position: int("position").notNull(),
    topicPosition: int("topicPosition").notNull(),
    subject: varchar("subject", { length: 140 }).notNull(),
    topic: varchar("topic", { length: 300 }).notNull(),
    completedAt: timestamp("completedAt"),
    generationLockId: varchar("generationLockId", { length: 36 }),
    generationLockExpiresAt: timestamp("generationLockExpiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_nodes_goal_level_position_uq").on(table.userId, table.goalId, table.level, table.position),
    uniqueIndex("ultra_study_nodes_goal_discipline_topic_level_uq").on(
      table.userId,
      table.goalId,
      table.disciplineId,
      table.topicPosition,
      table.level,
    ),
    index("ultra_study_nodes_goal_idx").on(table.userId, table.goalId, table.level, table.position),
  ],
);

/** AI-generated questions hold answer keys privately; public mappers omit these fields. */
export const studyQuestions = mysqlTable(
  "ultra_study_questions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    goalId: int("goalId").notNull().references(() => studyGoals.id, { onDelete: "cascade" }),
    nodeId: int("nodeId").notNull().references(() => studyNodes.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 140 }).notNull(),
    topic: varchar("topic", { length: 300 }).notNull(),
    board: varchar("board", { length: 100 }).notNull(),
    format: mysqlEnum("format", ["CE", "AD", "AE"]).$type<ExamFormat>().notNull(),
    level: int("level").notNull(),
    difficulty: mysqlEnum("difficulty", ["Fácil", "Médio", "Difícil"]).notNull(),
    prompt: text("prompt").notNull(),
    promptHash: varchar("promptHash", { length: 64 }).notNull(),
    choices: json("choices").$type<QuestionChoice[]>().notNull(),
    correctAnswer: varchar("correctAnswer", { length: 10 }).notNull(),
    explanation: text("explanation").notNull(),
    trap: text("trap").notNull(),
    rationales: json("rationales").$type<AnswerRationale[]>().notNull(),
    source: mysqlEnum("source", ["ai", "sample"]).default("ai").notNull(),
    generationId: varchar("generationId", { length: 36 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_questions_user_node_prompt_hash_uq").on(table.userId, table.nodeId, table.promptHash),
    uniqueIndex("ultra_study_questions_user_generation_order_uq").on(table.userId, table.generationId, table.id),
    index("ultra_study_questions_node_idx").on(table.userId, table.nodeId, table.createdAt),
    index("ultra_study_questions_goal_idx").on(table.userId, table.goalId),
  ],
);

/** Immutable attempts; requestId is the per-user idempotency key. */
export const studyAnswers = mysqlTable(
  "ultra_study_answers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull().references(() => studyQuestions.id, { onDelete: "cascade" }),
    nodeId: int("nodeId").notNull().references(() => studyNodes.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 140 }).notNull(),
    topic: varchar("topic", { length: 300 }).notNull(),
    requestId: varchar("requestId", { length: 36 }).notNull(),
    value: varchar("value", { length: 10 }),
    correct: boolean("correct").notNull(),
    blank: boolean("blank").notNull(),
    xpAwarded: int("xpAwarded").default(0).notNull(),
    nodeCompleted: boolean("nodeCompleted").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_answers_user_request_uq").on(table.userId, table.requestId),
    index("ultra_study_answers_user_node_idx").on(table.userId, table.nodeId),
    index("ultra_study_answers_user_question_idx").on(table.userId, table.questionId),
  ],
);

/** One XP award per user/question, independent of retries or repeated submissions. */
export const studyQuestionRewards = mysqlTable(
  "ultra_study_question_rewards",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull(),
    earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_question_rewards_user_question_uq").on(table.userId, table.questionId),
    foreignKey({
      name: "ultra_study_question_rewards_question_fk",
      columns: [table.questionId],
      foreignColumns: [studyQuestions.id],
    }).onDelete("cascade"),
  ],
);

/** Resolved rows are retained as history; only unresolved rows appear in the live error notebook. */
export const studyErrorEntries = mysqlTable(
  "ultra_study_error_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: int("questionId").notNull().references(() => studyQuestions.id, { onDelete: "cascade" }),
    nodeId: int("nodeId").notNull().references(() => studyNodes.id, { onDelete: "cascade" }),
    errorCount: int("errorCount").default(1).notNull(),
    lastErrorAt: timestamp("lastErrorAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_errors_user_question_uq").on(table.userId, table.questionId),
    index("ultra_study_errors_user_pending_idx").on(table.userId, table.resolvedAt, table.lastErrorAt),
  ],
);

/** Persisted per-user daily caps: one verticalization counter and one question-batch counter. */
export const studyDailyUsage = mysqlTable(
  "ultra_study_daily_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    day: varchar("day", { length: 10 }).notNull(),
    verticalizations: int("verticalizations").default(0).notNull(),
    questionGenerations: int("questionGenerations").default(0).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("ultra_study_daily_usage_user_day_uq").on(table.userId, table.day),
  ],
);

export type StudyDocumentRow = typeof studyDocuments.$inferSelect;
export type StudyGoalRow = typeof studyGoals.$inferSelect;
export type StudyNodeRow = typeof studyNodes.$inferSelect;
export type StudyQuestionRow = typeof studyQuestions.$inferSelect;
