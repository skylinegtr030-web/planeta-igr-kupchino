import pg from 'pg';
export type Db = pg.Pool;
export const createPool = (url?: string): Db => new pg.Pool({ ...(url ? { connectionString: url } : {}), max: 10 });
