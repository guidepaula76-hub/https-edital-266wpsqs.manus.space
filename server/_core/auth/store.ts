import { randomUUID } from "node:crypto";
import { createPool, type Pool, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

export type AuthUser = { id: number; name: string; email: string; method: string };
export type AuthCredential = { user: AuthUser; passwordHash: string };
export type StoredSession = { user: AuthUser; csrfToken: string; expiresAt: Date };

export type NewSession = {
  tokenHash: string;
  csrfToken: string;
  expiresAt: Date;
};

export interface AuthStore {
  createAccount(input: { name: string; email: string; passwordHash: string } & NewSession): Promise<AuthUser>;
  findCredential(email: string): Promise<AuthCredential | null>;
  createSession(userId: number, session: NewSession): Promise<void>;
  findSession(tokenHash: string): Promise<StoredSession | null>;
  extendSession(tokenHash: string, expiresAt: Date): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
  updateName(userId: number, name: string): Promise<AuthUser | null>;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "DuplicateEmailError";
  }
}

class MySqlAuthStore implements AuthStore {
  private poolInstance: Pool | undefined;

  private pool(): Pool {
    if (this.poolInstance) return this.poolInstance;
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Database is unavailable");
    this.poolInstance = createPool(url);
    return this.poolInstance;
  }

  async createAccount(input: { name: string; email: string; passwordHash: string } & NewSession): Promise<AuthUser> {
    const connection = await this.pool().getConnection();
    try {
      await connection.beginTransaction();
      const [userResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO `users` (`openId`, `name`, `email`, `loginMethod`, `lastSignedIn`) VALUES (?, ?, ?, 'email', CURRENT_TIMESTAMP)",
        [randomUUID(), input.name, input.email],
      );
      const userId = userResult.insertId;
      await connection.execute(
        "INSERT INTO `ultra_auth_credentials` (`userId`, `emailNormalized`, `passwordHash`) VALUES (?, ?, ?)",
        [userId, input.email, input.passwordHash],
      );
      await connection.execute(
        "INSERT INTO `ultra_auth_sessions` (`userId`, `tokenHash`, `csrfToken`, `expiresAt`) VALUES (?, ?, ?, ?)",
        [userId, input.tokenHash, input.csrfToken, input.expiresAt],
      );
      await connection.commit();
      return { id: userId, name: input.name, email: input.email, method: "email" };
    } catch (error) {
      await connection.rollback();
      if (isDuplicateKey(error)) throw new DuplicateEmailError();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findCredential(email: string): Promise<AuthCredential | null> {
    const [rows] = await this.pool().execute<(RowDataPacket & {
      id: number; name: string | null; email: string | null; passwordHash: string;
    })[]>(
      "SELECT u.`id`, u.`name`, u.`email`, c.`passwordHash` FROM `ultra_auth_credentials` c JOIN `users` u ON u.`id` = c.`userId` WHERE c.`emailNormalized` = ? LIMIT 1",
      [email],
    );
    const row = rows[0];
    if (!row || !row.email) return null;
    return {
      user: { id: row.id, name: row.name ?? "", email: row.email, method: "email" },
      passwordHash: row.passwordHash,
    };
  }

  async createSession(userId: number, session: NewSession): Promise<void> {
    const connection = await this.pool().getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "INSERT INTO `ultra_auth_sessions` (`userId`, `tokenHash`, `csrfToken`, `expiresAt`) VALUES (?, ?, ?, ?)",
        [userId, session.tokenHash, session.csrfToken, session.expiresAt],
      );
      await connection.execute("UPDATE `users` SET `lastSignedIn` = CURRENT_TIMESTAMP WHERE `id` = ?", [userId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findSession(tokenHash: string): Promise<StoredSession | null> {
    const [rows] = await this.pool().execute<(RowDataPacket & {
      id: number; name: string | null; email: string | null; csrfToken: string;
      expiresAt: Date | string;
    })[]>(
      "SELECT u.`id`, u.`name`, u.`email`, u.`loginMethod`, s.`csrfToken`, s.`expiresAt` FROM `ultra_auth_sessions` s JOIN `users` u ON u.`id` = s.`userId` WHERE s.`tokenHash` = ? AND s.`expiresAt` > CURRENT_TIMESTAMP LIMIT 1",
      [tokenHash],
    );
    const row = rows[0];
    if (!row || !row.email) return null;
    return {
      user: { id: row.id, name: row.name ?? "", email: row.email, method: row.loginMethod ?? "email" },
      csrfToken: row.csrfToken,
      expiresAt: row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt),
    };
  }

  async extendSession(tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool().execute(
      "UPDATE `ultra_auth_sessions` SET `expiresAt` = ? WHERE `tokenHash` = ?",
      [expiresAt, tokenHash],
    );
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool().execute("DELETE FROM `ultra_auth_sessions` WHERE `tokenHash` = ?", [tokenHash]);
  }

  async updateName(userId: number, name: string): Promise<AuthUser | null> {
    await this.pool().execute("UPDATE `users` SET `name` = ? WHERE `id` = ?", [name, userId]);
    const [rows] = await this.pool().execute<(RowDataPacket & {
      id: number; name: string | null; email: string | null; loginMethod: string | null;
    })[]>("SELECT `id`, `name`, `email`, `loginMethod` FROM `users` WHERE `id` = ? LIMIT 1", [userId]);
    const row = rows[0];
    if (!row || !row.email) return null;
    return { id: row.id, name: row.name ?? "", email: row.email, method: row.loginMethod ?? "email" };
  }
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY");
}

export const authStore: AuthStore = new MySqlAuthStore();
