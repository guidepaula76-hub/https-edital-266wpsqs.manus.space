import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./baseSchema";

export { users } from "./baseSchema";
export type { User, InsertUser } from "./baseSchema";

/** Password credentials are separate from the platform OAuth user record. */
export const authCredentials = mysqlTable("ultra_auth_credentials", {
  userId: int("userId").notNull().primaryKey().references(() => users.id, { onDelete: "cascade" }),
  emailNormalized: varchar("emailNormalized", { length: 320 }).notNull().unique("ultra_auth_credentials_email_uq"),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Opaque application sessions; only a SHA-256 digest of the cookie is persisted. */
export const authSessions = mysqlTable("ultra_auth_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique("ultra_auth_sessions_token_hash_uq"),
  csrfToken: varchar("csrfToken", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("ultra_auth_sessions_user_id_idx").on(table.userId)]);

export {
  studyDocuments, studyGoals, studyPreferences, studyDisciplines, studyNodes,
  studyQuestions, studyAnswers, studyQuestionRewards, studyErrorEntries, studyDailyUsage,
} from "./studySchema";
