import qs from "qs";
import {createParamDecorator, type ExecutionContext} from "@nestjs/common";
import type {Request} from "express";
import {parsed2filter, parsed2sorting} from "std-json-api/json-api-query";
import LimitOffsetPaginationStrategy from "std-json-api/pagination-strategies/limit-offset-strategy";
import {MultipleArgs} from "./adapter";

export type SearchDescriptor = MultipleArgs;

const Search = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    /**
     * JSON:API query string is a bit more complex than just `application/x-www-form-urlencoded` ("extended" version in express terms).
     * We use `qs` package to parse the query string into a nested object.
     *
     * @see https://jsonapi.org/format/#appendix-query-details
     */
    const req = ctx.switchToHttp().getRequest<Request>();
    const search = (req.originalUrl.startsWith("http")
        ? new URL(req.originalUrl)
        : new URL(req.originalUrl, `http://localhost`)).search.replace(/^\?/, "");
    const parsed = qs.parse(search);

    // determine the pagination strategy
    const paginationStrategy = req.headers["x-pagination-strategy"] ??
        "limit-offset";
    let page;
    switch (paginationStrategy) {
        case "limit-offset":
        default:
            page = LimitOffsetPaginationStrategy.parse(req, parsed);
            break;
    }

    return {
        page,
        sort: parsed2sorting(parsed.sort),
        filter: parsed2filter(parsed.filter),
    } as SearchDescriptor;
});

export default Search;
