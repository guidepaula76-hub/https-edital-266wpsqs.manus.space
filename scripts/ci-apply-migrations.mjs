import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
const connection = await mysql.createConnection(databaseUrl);
let activeMigration = "unknown";
let activeStatement = 0;

try {
  for (const entry of journal.entries) {
    activeMigration = entry.tag;
    const sql = await readFile(`drizzle/${entry.tag}.sql`, "utf8");
    const statements = sql
      .split(/--> statement-breakpoint/g)
      .map(statement => statement.trim())
      .filter(Boolean);

    for (let index = 0; index < statements.length; index += 1) {
      activeStatement = index + 1;
      await connection.query(statements[index]);
    }
    console.log(`Applied ${entry.tag} (${statements.length} statements)`);
  }

  const [tableRows] = await connection.query("SHOW TABLES");
  const tables = new Set(tableRows.map(row => Object.values(row)[0]));
  const requiredTables = [
    "users",
    "ultra_auth_credentials",
    "ultra_auth_sessions",
    "ultra_study_answers",
    "ultra_study_daily_usage",
    "ultra_study_disciplines",
    "ultra_study_documents",
    "ultra_study_error_entries",
    "ultra_study_goals",
    "ultra_study_nodes",
    "ultra_study_preferences",
    "ultra_study_question_rewards",
    "ultra_study_questions",
  ];
  const missing = requiredTables.filter(table => !tables.has(table));
  if (missing.length) throw new Error(`Missing tables after migrations: ${missing.join(", ")}`);
  console.log(`Migration check passed: ${requiredTables.length} required tables exist.`);
} catch (error) {
  console.error(`Migration failed at ${activeMigration}, statement ${activeStatement}:`);
  console.error(error);
  process.exitCode = 1;
} finally {
  await connection.end();
}
