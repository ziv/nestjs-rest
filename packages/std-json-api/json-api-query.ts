import qs, { type ParsedQs } from "qs";
import type { Request } from "express";

export type RestAdapterFilter = ParsedQs;
export type RestAdapterSorting = { field: string; dir: "asc" | "desc" };
export type RestAdapterPagination = { offset: number; limit: number };

export function parsed2sorting(
  sortString: unknown,
): RestAdapterSorting[] {
  if (!sortString || typeof sortString !== "string") {
    return [];
  }

  return sortString.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const dir = s.startsWith("-") ? "desc" : "asc";
      const field = dir === "desc" ? s.slice(1) : s;
      return { field, dir };
    });
}

export function parsed2filter(
  filter: unknown,
): RestAdapterFilter {
  if (typeof filter === "string") {
    return qs.parse(filter);
  }
  if (typeof filter === "object" && filter !== null) {
    return filter as RestAdapterFilter;
  }
  return {};
}
