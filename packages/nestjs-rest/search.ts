import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import qs, { type ParsedQs } from "qs";
import { MultipleArgs } from "./adapter";

export type SearchDescriptor = MultipleArgs;
export type RestAdapterFilter = ParsedQs;
export type RestAdapterSorting = { [key: string]: -1 | 1 };
export type RestAdapterPagination = { offset: number; limit: number };

function parsed2pagination(page: unknown): RestAdapterPagination {
  if (
    typeof page === "object" && page !== null && "offset" in page &&
    "limit" in page
  ) {
    const offset = parseInt(String(page.offset), 10);
    const limit = parseInt(String(page.limit), 10);

    if (isNaN(offset) || isNaN(limit)) {
      throw new Error("Invalid pagination parameters");
    }
    return { offset, limit };
  }

  return { offset: 0, limit: 20 };
}

function parsed2sorting(
  sortString: unknown,
): RestAdapterSorting {
  let res: RestAdapterSorting = {};
  if (!sortString || typeof sortString !== "string") {
    return res;
  }

  return sortString.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce((acc, cur) => {
      const dir = cur.startsWith("-") ? -1 : 1;
      const field = dir === -1 ? cur.slice(1) : cur;
      acc[field] = dir;
      return acc;
    }, res);
}

function parsed2filter(
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

const Search = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  /**
   * JSON:API query string is a bit more complex than just `application/x-www-form-urlencoded` ("extended" version in express terms).
   * We use `qs` package to parse the query string into a nested object.
   *
   * @see https://jsonapi.org/format/#appendix-query-details
   */
  const req = ctx.switchToHttp().getRequest<Request>();
  const isAbsolute = req.originalUrl.startsWith("http:/") ||
    req.originalUrl.startsWith("https:/");
  const searchString = (isAbsolute
    ? new URL(req.originalUrl)
    : new URL(req.originalUrl, `http://localhost`)).search.replace(/^\?/, "");

  const parsed = qs.parse(searchString) as MultipleArgs;

  parsed.sort = parsed2sorting(parsed.sort);
  parsed.filter = parsed2filter(parsed.filter);
  parsed.page = parsed2pagination(parsed.page);

  return parsed as SearchDescriptor;
});

export default Search;
