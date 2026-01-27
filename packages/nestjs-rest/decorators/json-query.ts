import type {Request} from "express";
import {createParamDecorator, type ExecutionContext} from "@nestjs/common";
import {parser, type JsonApiQuery} from "std-json-api";

export const JsonQuery = createParamDecorator((_: unknown, ctx: ExecutionContext): JsonApiQuery => {
    const url = ctx.switchToHttp().getRequest<Request>().originalUrl;
    const abs = url.startsWith("http:/") || url.startsWith("https:/");
    const searchString = (abs ? new URL(url) : new URL(url, `http://localhost`)).search.replace(/^\?/, "");
    return parser(searchString);
});
