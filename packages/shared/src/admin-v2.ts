import { z } from 'zod';

const slug = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,60}$/, 'Только латиница, цифры и дефис');
const price = z.number().min(0).max(1_000_000);

/* ───────── каталог ───────── */
import { CategoryKind } from './catalog.js';
export const CategoryInput = z.object({
  slug: slug.optional(), title: z.string().trim().min(1).max(120), kind: CategoryKind, description: z.string().max(1000).default(''),
  isPublished: z.boolean().default(true), sort: z.number().int().min(0).max(10_000).default(100),
});
export type CategoryInput = z.infer<typeof CategoryInput>;
export const AdminCategory = CategoryInput.extend({ id: z.string(), slug: z.string(), productCount: z.number() });
export type AdminCategory = z.infer<typeof AdminCategory>;

export const ProductOption = z.object({ label: z.string().trim().min(1).max(60), price: price, from: z.boolean().optional() });
export const ProductInput = z.object({
  categoryId: z.string().uuid(), slug: slug.optional(), title: z.string().trim().min(1).max(200),
  shortDesc: z.string().max(300).default(''), description: z.string().max(4000).default(''), badge: z.string().max(60).nullable().default(null),
  priceWeekday: price.default(0), priceWeekend: price.default(0), priceFrom: z.boolean().default(false),
  durationMin: z.number().int().min(0).max(24 * 60).default(0), guests: z.number().int().min(0).max(500).nullable().default(null), minAge: z.number().int().min(0).max(18).nullable().default(null),
  capacity: z.string().max(80).nullable().default(null), extendPerHour: price.nullable().default(null),
  features: z.array(z.string().trim().min(1).max(160)).max(30).default([]), options: z.array(ProductOption).max(12).default([]),
  coverMediaId: z.string().uuid().nullable().default(null), isPublished: z.boolean().default(true), sort: z.number().int().min(0).max(10_000).default(100),
});
export type ProductInput = z.infer<typeof ProductInput>;
export const ProductInputPatch = ProductInput.partial();
export type ProductInputPatch = z.infer<typeof ProductInputPatch>;
export const AdminProductFull = ProductInput.extend({ id: z.string(), slug: z.string(), category: z.string(), categoryKind: CategoryKind, cover: z.string().nullable(), updatedAt: z.string() });
export type AdminProductFull = z.infer<typeof AdminProductFull>;

/* ───────── фото ───────── */
export const GalleryInput = z.object({ slug, title: z.string().trim().min(1).max(120) });
export type GalleryInput = z.infer<typeof GalleryInput>;
export const GalleryOrder = z.object({ mediaIds: z.array(z.string().uuid()).max(500) });
export type GalleryOrder = z.infer<typeof GalleryOrder>;
export const BlockGallery = z.object({ gallery: z.string().max(80) });

/* ───────── контент ───────── */
export const ReviewInput = z.object({
  author: z.string().trim().min(1).max(120), text: z.string().trim().min(1).max(2000), rating: z.number().int().min(1).max(5).default(5),
  source: z.string().max(80).nullable().default(null), isPublished: z.boolean().default(true), sort: z.number().int().min(0).max(10_000).default(100),
});
export type ReviewInput = z.infer<typeof ReviewInput>;
export const AdminReview = ReviewInput.extend({ id: z.string(), createdAt: z.string() });
export type AdminReview = z.infer<typeof AdminReview>;

export const PromoInput = z.object({
  code: z.string().trim().min(2).max(40).transform((s) => s.toUpperCase()), kind: z.enum(['percent', 'fixed']), value: z.number().positive().max(1_000_000),
  minTotal: z.number().min(0).default(0), validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null), validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  maxUses: z.number().int().positive().nullable().default(null), active: z.boolean().default(true),
});
export type PromoInput = z.infer<typeof PromoInput>;
export const AdminPromo = PromoInput.extend({ usedCount: z.number() });
export type AdminPromo = z.infer<typeof AdminPromo>;

export const SpecialDayInput = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), kind: z.enum(['holiday', 'closed', 'short']),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null), closeTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null), note: z.string().max(200).default(''),
});
export type SpecialDayInput = z.infer<typeof SpecialDayInput>;

export const BlockCreate = z.object({ key: z.string().regex(/^[a-z0-9.-]{3,80}$/), title: z.string().trim().min(1).max(200), kind: z.enum(['zone', 'hero', 'doc', 'text']), gallery: z.string().max(80).optional() });
export type BlockCreate = z.infer<typeof BlockCreate>;

export const AdminUserInput = z.object({ email: z.string().trim().email().max(200), password: z.string().min(8).max(200), role: z.enum(['owner', 'manager', 'editor']).default('manager') });
export type AdminUserInput = z.infer<typeof AdminUserInput>;
export const AdminUserPatch = z.object({ role: z.enum(['owner', 'manager', 'editor']).optional(), isActive: z.boolean().optional(), password: z.string().min(8).max(200).optional() });
export type AdminUserPatch = z.infer<typeof AdminUserPatch>;
export const AdminUser = z.object({ id: z.string(), email: z.string(), role: z.enum(['owner', 'manager', 'editor']), isActive: z.boolean(), lastLoginAt: z.string().nullable(), createdAt: z.string() });
export type AdminUser = z.infer<typeof AdminUser>;

export const AuditEntry = z.object({ id: z.number(), admin: z.string().nullable(), entity: z.string(), entityId: z.string().nullable(), action: z.string(), diff: z.unknown(), at: z.string() });
export type AuditEntry = z.infer<typeof AuditEntry>;
