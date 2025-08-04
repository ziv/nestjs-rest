import type {Request} from "express";
import {createParamDecorator, type ExecutionContext} from "@nestjs/common";
import queryStringParser, {type JsonApiQuery} from "std-json-api/query-string-parser";

const Search = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const url = ctx.switchToHttp().getRequest<Request>().originalUrl;
    const abs = url.startsWith("http:/") || url.startsWith("https:/");
    const searchString = (abs ? new URL(url) : new URL(url, `http://localhost`)).search.replace(/^\?/, "");
    return queryStringParser(searchString) as JsonApiQuery;
});

export default Search;
