import { Pool } from 'pg';

/**
 * A single shared connection pool. Better Auth talks to Postgres through this,
 * and manages its own tables (user, session, account, jwks, verification)
 * via the Better Auth CLI — see README.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});
