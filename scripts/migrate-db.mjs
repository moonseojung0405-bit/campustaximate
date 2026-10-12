import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running db:migrate.');
const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(new URL('../db/migrations/001_initial.sql', import.meta.url), 'utf8')
 .split(';').map(statement => statement.trim()).filter(Boolean);
await sql.transaction([
 sql.query("SELECT pg_advisory_xact_lock(hashtextextended('campustaximate:migrations', 0))"),
 ...statements.map(statement => sql.query(statement)),
]);
console.log('PostgreSQL schema is ready.');
