import { z } from 'zod';

export const OrderStatus = z.enum(['new', 'in_progress', 'confirmed', 'done', 'cancelled']);
export type OrderStatus = z.infer<typeof OrderStatus>;
export const AdminRole = z.enum(['owner', 'manager', 'editor']);
export type AdminRole = z.infer<typeof AdminRole>;
export const LoginInput = z.object({ email: z.string().trim().min(3).max(200), password: z.string().min(1).max(200) });
export type LoginInput = z.infer<typeof LoginInput>;
export const OrderPatch = z.object({ status: OrderStatus.optional(), adminNote: z.string().max(2000).optional() })
  .refine((v) => v.status !== undefined || v.adminNote !== undefined, 'Нечего менять');
export type OrderPatch = z.infer<typeof OrderPatch>;
export const AdminOrder = z.object({
  id: z.string(), number: z.number(), status: OrderStatus,
  customerName: z.string(), phone: z.string(), childName: z.string().nullable(),
  eventDate: z.string().nullable(), eventTime: z.string().nullable(), comment: z.string().nullable(),
  total: z.number(), adminNote: z.string(), createdAt: z.string(),
  items: z.array(z.object({ title: z.string(), qty: z.number(), unitPrice: z.number() })),
});
export type AdminOrder = z.infer<typeof AdminOrder>;
