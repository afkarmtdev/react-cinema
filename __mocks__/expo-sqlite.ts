/**
 * Jest stand-in for expo-sqlite, picked up through jest.mock('expo-sqlite')
 * in jest.setup.js. The native module cannot run under Node, so this keeps
 * rows in memory instead.
 *
 * It does not parse SQL. It relies on how src/lib/sqliteStore.ts writes its
 * statements: every value is a named parameter ($ownerId, $id, ...) whose
 * name is the camel-cased column, INSERT and UPDATE carry every column,
 * SELECT filters by $ownerId and orders by updated_at descending, and
 * DELETE goes by $id. Change the store's SQL and this has to follow.
 */

type Params = Record<string, unknown>;
type Row = Record<string, unknown>;

const columnName = (param: string) =>
  param.replace(/^\$/, '').replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const toRow = (params: Params): Row =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [columnName(key), value]),
  );

const verbOf = (sql: string) => sql.trim().split(/\s+/)[0].toUpperCase();

export class SQLiteDatabase {
  rows = new Map<string, Row>();

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(
    sql: string,
    params: Params = {},
  ): Promise<{ changes: number; lastInsertRowId: number }> {
    const verb = verbOf(sql);
    if (verb === 'INSERT') {
      const row = toRow(params);
      const id = String(row.id);
      if (this.rows.has(id)) {
        if (/OR IGNORE/i.test(sql)) return { changes: 0, lastInsertRowId: 0 };
        throw new Error(`UNIQUE constraint failed: entries.id (${id})`);
      }
      this.rows.set(id, row);
      return { changes: 1, lastInsertRowId: this.rows.size };
    }
    if (verb === 'UPDATE') {
      const row = toRow(params);
      const id = String(row.id);
      const existing = this.rows.get(id);
      if (!existing) return { changes: 0, lastInsertRowId: 0 };
      this.rows.set(id, { ...existing, ...row });
      return { changes: 1, lastInsertRowId: 0 };
    }
    if (verb === 'DELETE') {
      const removed = this.rows.delete(String(params.$id));
      return { changes: removed ? 1 : 0, lastInsertRowId: 0 };
    }
    throw new Error(`fake expo-sqlite: unsupported statement "${sql}"`);
  }

  async getAllAsync<T>(_sql: string, params: Params = {}): Promise<T[]> {
    let rows = [...this.rows.values()];
    if ('$ownerId' in params) {
      rows = rows.filter((row) => row.owner_id === params.$ownerId);
    }
    rows.sort((a, b) => Number(b.updated_at) - Number(a.updated_at));
    return rows as T[];
  }

  async getFirstAsync<T>(sql: string, params: Params = {}): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] ?? null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
  }

  async withExclusiveTransactionAsync(
    task: (txn: SQLiteDatabase) => Promise<void>,
  ): Promise<void> {
    await task(this);
  }

  async closeAsync(): Promise<void> {}
}

const databases = new Map<string, SQLiteDatabase>();

export async function openDatabaseAsync(name: string): Promise<SQLiteDatabase> {
  let db = databases.get(name);
  if (!db) {
    db = new SQLiteDatabase();
    databases.set(name, db);
  }
  return db;
}

/** Empties every open database. Called before each test in jest.setup.js. */
export function __reset(): void {
  for (const db of databases.values()) db.rows.clear();
}
