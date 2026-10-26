import { z } from 'zod';
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().max(120).optional(),
  sort: z.string().max(30).optional(),
  brand: z.string().max(80).optional(),
  type: z.string().max(80).optional(),
  minSize: z.coerce.number().nonnegative().optional(),
  maxSize: z.coerce.number().nonnegative().optional(),
  lure: z.string().optional(),
  species: z.string().max(100).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});
export const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
