import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { AdminRole } from '@pi/shared';
import type { Db } from '../db/pool.js';

export interface AdminIdentity { id: string; email: string; role: AdminRole }
export interface AuthService {
  login(email: string, password: string, meta: { ip: string; userAgent: string }): Promise<{ token: string; admin: AdminIdentity } | null>;
  session(token: string): Promise<AdminIdentity | null>;
  logout(token: string): Promise<void>;
}
const sha = (t: string) => createHash('sha256').update(t).digest('hex');

export const authService = (db: Db): AuthService => ({
  async login(email, password, meta) {
    const { rows } = await db.query<AdminIdentity & { pass_hash: string }>(
      'select id, email::text as email, role, pass_hash from admins where email = $1 and is_active', [email]);
    const a = rows[0];
    if (!a || !(await bcrypt.compare(password, a.pass_hash))) return null;
    const token = randomBytes(32).toString('base64url');
    await db.query(
      `insert into admin_sessions (token_hash, admin_id, ip, user_agent, expires_at) values ($1, $2, $3, $4, now() + interval '30 days')`,
      [sha(token), a.id, meta.ip || null, meta.userAgent.slice(0, 300)]);
    await db.query('update admins set last_login_at = now() where id = $1', [a.id]);
    return { token, admin: { id: a.id, email: a.email, role: a.role } };
  },
  async session(token) {
    const { rows } = await db.query<AdminIdentity>(
      `select a.id, a.email::text as email, a.role from admin_sessions s join admins a on a.id = s.admin_id
       where s.token_hash = $1 and s.expires_at > now() and a.is_active`, [sha(token)]);
    return rows[0] ?? null;
  },
  async logout(token) {
    await db.query('delete from admin_sessions where token_hash = $1', [sha(token)]);
  },
});
