import { z } from 'zod';

export const Contacts = z.object({
  phone: z.string().default(''), hours: z.string().default(''),
  addressFull: z.string().default(''), addressShort: z.string().default(''),
  mapQuery: z.string().default(''), mapLat: z.number().nullable().default(null), mapLon: z.number().nullable().default(null),
});
export type Contacts = z.infer<typeof Contacts>;
export const SiteSettings = z.object({
  ok: z.literal(true),
  contacts: Contacts,
  ages: z.record(z.number()).default({}),
  tiers: z.record(z.number()).default({}),
  weekendDays: z.array(z.number().int()).default([0, 6]),
  holidays: z.array(z.string()).default([]),
});
export type SiteSettings = z.infer<typeof SiteSettings>;

export const Review = z.object({ author: z.string(), text: z.string(), rating: z.number().int().min(1).max(5), source: z.string().nullable() });
export type Review = z.infer<typeof Review>;
export const Reviews = z.object({ ok: z.literal(true), reviews: z.array(Review) });
export type Reviews = z.infer<typeof Reviews>;

export const Company = z.object({
  name: z.string().default(''), shortName: z.string().default(''), legalAddress: z.string().default(''),
  inn: z.string().default(''), kpp: z.string().default(''), ogrn: z.string().default(''),
  bank: z.string().default(''), bik: z.string().default(''), account: z.string().default(''), corrAccount: z.string().default(''),
  director: z.string().default(''), phone: z.string().default(''), email: z.string().default(''),
});
export type Company = z.infer<typeof Company>;

export const Doc = z.object({ slug: z.string(), title: z.string(), body: z.string(), published: z.boolean(), sort: z.number(), updatedAt: z.string().nullable() });
export type Doc = z.infer<typeof Doc>;
