import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Initialize DB client. Prefer @libsql/client when DATABASE_URL is set (for libSQL).
// Fall back to a local better-sqlite3 file database for development / scripts when
// DATABASE_URL is not provided to avoid "URL undefined" errors during scripts.
let dbInstance: ReturnType<typeof drizzleLibsql> | ReturnType<typeof drizzleSqlite>;

if (process.env.DATABASE_URL) {
  const client = createClient({ url: process.env.DATABASE_URL });
  dbInstance = drizzleLibsql(client, { schema });
} else {
  const sqliteFile = process.env.SQLITE_FILE || './dev.db';
  const sqlite = new Database(sqliteFile);
  dbInstance = drizzleSqlite(sqlite, { schema });
}

// Export as any to preserve the Drizzle query API across the codebase. The
// runtime instance may be either a libsql or better-sqlite3 drizzle client.
export const db: any = dbInstance;