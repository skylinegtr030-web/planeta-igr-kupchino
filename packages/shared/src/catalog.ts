import { z } from 'zod';

export const CategoryKind = z.enum(['package', 'room', 'service', 'ticket', 'activity']);
export type CategoryKind = z.infer<typeof CategoryKind>;
export const Product = z.object({
  slug: z.string(), title: z.string(), description: z.string().default(''),
  features: z.array(z.string()).default([]),
  priceWeekday: z.number().nonnegative(), priceWeekend: z.number().nonnegative(),
  priceFrom: z.boolean().default(false), durationMin: z.number().int().nullable().default(null),
  cover: z.string().nullable().default(null),
  mark: z.string().nullable().default(null),
  short: z.string().nullable().default(''),
  capacity: z.string().nullable().default(null), guests: z.number().int().nullable().default(null), minAge: z.number().int().nullable().default(null),
  extendPerHour: z.number().nullable().default(null),
  options: z.array(z.object({ label: z.string(), price: z.number(), from: z.boolean().optional() })).default([]),
});
export type Product = z.infer<typeof Product>;
export const Category = z.object({ slug: z.string(), title: z.string(), kind: CategoryKind, items: z.array(Product) });
export type Category = z.infer<typeof Category>;
export const Catalog = z.object({ ok: z.literal(true), categories: z.array(Category) });
export type Catalog = z.infer<typeof Catalog>;
