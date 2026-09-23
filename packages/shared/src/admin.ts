import { z } from 'zod';

const nonEmpty = (v: Record<string, unknown>) => Object.values(v).some((x) => x !== undefined);

export const OrderStatus = z.enum(['new', 'in_progress', 'confirmed', 'done', 'cancelled']);
export type OrderStatus = z.infer<typeof OrderStatus>;
export const AdminRole = z.enum(['owner', 'manager', 'editor']);
export type AdminRole = z.infer<typeof AdminRole>;
export const LoginInput = z.object({ email: z.string().trim().min(3).max(200), password: z.string().min(1).max(200) });
export type LoginInput = z.infer<typeof LoginInput>;

export const OrderPatch = z.object({ status: OrderStatus.optional(), adminNote: z.string().max(2000).optional() }).refine(nonEmpty, 'Нечего менять');
export type OrderPatch = z.infer<typeof OrderPatch>;
export const AdminOrder = z.object({
  id: z.string(), number: z.number(), status: OrderStatus,
  customerName: z.string(), phone: z.string(), childName: z.string().nullable(),
  eventDate: z.string().nullable(), eventTime: z.string().nullable(), comment: z.string().nullable(),
  total: z.number(), adminNote: z.string(), createdAt: z.string(),
  items: z.array(z.object({ title: z.string(), qty: z.number(), unitPrice: z.number() })),
});
export type AdminOrder = z.infer<typeof AdminOrder>;

const price = z.number().min(0).max(1_000_000);
export const ProductPatch = z.object({
  title: z.string().trim().min(1).max(200).optional(), priceWeekday: price.optional(), priceWeekend: price.optional(), isPublished: z.boolean().optional(),
}).refine(nonEmpty, 'Нечего менять');
export type ProductPatch = z.infer<typeof ProductPatch>;
export const AdminProduct = z.object({ id: z.string(), category: z.string(), title: z.string(), priceWeekday: z.number(), priceWeekend: z.number(), isPublished: z.boolean() });
export type AdminProduct = z.infer<typeof AdminProduct>;

export const MediaPatch = z.object({ isActive: z.boolean().optional(), alt: z.string().max(300).optional() }).refine(nonEmpty, 'Нечего менять');
export type MediaPatch = z.infer<typeof MediaPatch>;
export const AdminImage = z.object({ id: z.string(), src: z.string(), alt: z.string(), isActive: z.boolean(), w: z.number().nullable(), h: z.number().nullable() });
export type AdminImage = z.infer<typeof AdminImage>;
export const AdminGallery = z.object({ slug: z.string(), title: z.string(), images: z.array(AdminImage) });
export type AdminGallery = z.infer<typeof AdminGallery>;
