import type { AdminIdentity } from './services/auth.js';
declare module 'fastify' {
  interface FastifyRequest { admin: AdminIdentity | null }
}
export {};
