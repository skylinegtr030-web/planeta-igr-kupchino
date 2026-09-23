import { z } from 'zod';

const Env = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  WEB_DIST: z.string().default('apps/web/dist'),
  ADMIN_DIST: z.string().default('apps/admin/dist'),
  UPLOADS_DIR: z.string().default('uploads'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});
export type Config = z.infer<typeof Env>;
export const loadConfig = (env = process.env): Config => Env.parse(env);
