import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

type Row = Record<string, unknown>;
type Result = { results: Row[]; meta: { changes: number } };
type Client = NeonQueryFunction<false, true>;

// Keep parameters separate from SQL while adapting the existing query interface.
function parameterize(query: string) {
 let index = 0;
 return query.replace(/\?/g, () => `$${++index}`);
}

function normalize(result: {rows: Row[]; rowCount: number | null; fields: {name: string; dataTypeID: number}[]}): Result {
 return {
  results: result.rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
   const field = result.fields.find(field => field.name === key);
   // PostgreSQL bigint timestamps/counts arrive as strings; the UI expects numbers.
   if (field?.dataTypeID === 20 && typeof value === 'string') {
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error('Database integer exceeds safe range');
    return [key, number];
   }
   return [key, typeof value === 'boolean' ? Number(value) : value];
  }))),
  meta: { changes: result.rowCount ?? 0 },
 };
}

class PreparedQuery {
 constructor(readonly client: Client, readonly query: string, readonly values: unknown[] = []) {}
 bind(...values: unknown[]) { return new PreparedQuery(this.client, this.query, values); }
 execute() { return this.client.query(parameterize(this.query), this.values); }
 async all() { return normalize(await this.execute()); }
 async first<T = Row>(): Promise<T | null> { return ((await this.all()).results[0] as T) ?? null; }
 async run() { return this.all(); }
 async runLocked(rideId: string) {
  // After waiting for the lock, READ COMMITTED takes a fresh snapshot for the
  // seat count even when requests arrive at separate Vercel instances.
  const results = await this.client.transaction([
   this.client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [rideId]),
   this.execute(),
  ], { isolationLevel: 'ReadCommitted' });
  return normalize(results[1]);
 }
}

export function getRawDb() {
 const url = process.env.DATABASE_URL;
 if (!url) throw new Error('DATABASE_URL is required');
 const client = neon(url, { fullResults: true });
 return {
  prepare: (query: string) => new PreparedQuery(client, query),
  async batch(statements: PreparedQuery[]) {
   return (await client.transaction(statements.map(statement => statement.execute()))).map(normalize);
  },
 };
}
