import { Pool, type QueryResult, type QueryResultRow } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

type TxQuery = <R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<QueryResult<R>>;

export async function withTransaction<T>(fn: (txQuery: TxQuery) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  const txQuery = <R extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ) => client.query<R>(text, params);

  try {
    await client.query("begin");
    const result = await fn(txQuery);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
