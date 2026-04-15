import fs from 'fs/promises';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://rgc:rgc@localhost:5432/rgc';

export const pool = new Pool({ connectionString: DATABASE_URL });

export async function initializePostgres() {
  const schema = await fs.readFile(new URL('../../sql/schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
}

export async function query(text, params = []) {
  const { rows } = await pool.query(text, params);
  return rows;
}
