import { z } from 'zod';

const phone = z.string().trim().transform((v) => v.replace(/[^\d+]/g, ''))
  .refine((v) => /^\+?\d{10,15}$/.test(v), 'Некорректный телефон')
  .transform((v) => (v.startsWith('8') && v.length === 11 ? '+7' + v.slice(1) : v.startsWith('+') ? v : '+' + v));

export const OrderCreate = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(80),
  phone,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата в формате ГГГГ-ММ-ДД'),
  kids: z.coerce.number().int().min(1).max(60).optional(),
  packageSlug: z.string().max(80).optional(),
  extras: z.array(z.string().max(80)).max(20).default([]),
  comment: z.string().trim().max(1000).optional(),
});
export type OrderCreate = z.infer<typeof OrderCreate>;
export const OrderCreated = z.object({ ok: z.literal(true), id: z.number().int() });
export type OrderCreated = z.infer<typeof OrderCreated>;
export const ApiError = z.object({ ok: z.literal(false), error: z.string(), fields: z.record(z.string()).optional() });
export type ApiError = z.infer<typeof ApiError>;
