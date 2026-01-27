import type { Request } from "express";
import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { type JsonApiQuery, parser } from "std-json-api";

/**
 * Decorator that extracts and parses the JSON:API query parameters from the request URL.
 *
 * @returns {JsonApiQuery} The parsed JSON:API query object.
 */
export const JsonQuery = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JsonApiQuery => {
    const url = ctx.switchToHttp().getRequest<Request>().originalUrl;
    const abs = url.startsWith("http:/") || url.startsWith("https:/");
    const searchString = (abs ? new URL(url) : new URL(url, `http://localhost`))
      .search.replace(/^\?/, "");
    return parser(searchString);
  },
);
