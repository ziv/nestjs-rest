import { z } from "zod";

/**
 * Metatypes for generic models and filters.
 */
export type RestModel = { [key: string]: unknown };
export type RestFilter = { [key: string]: unknown };

export type Item<T = RestModel> = { data: T };
export type Items<T = RestModel> = Item<T[]> & {
  total: number;
  page: number;
  size: number;
};

export const PaginationAndSort = z.object({
  page: z.coerce.number().int().nonnegative().default(0),
  size: z.coerce.number().int().min(1).max(100).positive().default(20),
  sort: z.coerce.string().optional().default("id"),
  dir: z.coerce.string().optional().default("asc"),
});

export type QuerySchema = z.infer<typeof PaginationAndSort>;
