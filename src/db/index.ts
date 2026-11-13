import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const isProduction = process.env.NODE_ENV === 'production';
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || 'localhost',
      port: Number(process.env.SQL_PORT) || 5432,
      user: process.env.SQL_USER || 'rng_user',
      password: process.env.SQL_PASSWORD || 'rng_password',
      database: process.env.SQL_DB_NAME || 'rng_sf_db',
      max: 10,
      connectionTimeoutMillis: 5000,
      ssl: isProduction && process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL Pool idle client notification:', err.message);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });

// Test connection probe helper
export async function checkDatabaseHealth(): Promise<{ isPostgres: boolean; message: string }> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { isPostgres: true, message: 'Connected to PostgreSQL database' };
  } catch (err: any) {
    return {
      isPostgres: false,
      message: `PostgreSQL not accessible (${err.message}). Using persistent storage engine.`,
    };
  }
}
