import { Pool, PoolClient } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client:', err);
});

pool.on('connect', () => {
  console.log('[Database] New connection established');
});

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`[Database] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('[Database] Query error:', error);
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  try {
    return await pool.connect();
  } catch (error) {
    console.error('[Database] Failed to get client:', error);
    throw error;
  }
}

export async function close() {
  try {
    await pool.end();
    console.log('[Database] Pool closed');
  } catch (error) {
    console.error('[Database] Error closing pool:', error);
    throw error;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

// Monitor pool stats
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}
