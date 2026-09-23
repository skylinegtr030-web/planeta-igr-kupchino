import { z } from 'zod';

export const Image = z.object({ src: z.string(), alt: z.string(), w: z.number().nullable(), h: z.number().nullable() });
export type Image = z.infer<typeof Image>;
export const Block = z.object({ key: z.string(), data: z.record(z.unknown()), images: z.array(Image) });
export type Block = z.infer<typeof Block>;
export const Content = z.object({ ok: z.literal(true), blocks: z.array(Block) });
export type Content = z.infer<typeof Content>;
