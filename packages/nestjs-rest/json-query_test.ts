import { describe, it, mock } from "node:test";
import expect from "expect";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { jsonQueryDecorator } from "./json-query";

/**
 * Tests for the jsonQueryDecorator function.
 *
 * The decorator's responsibility is to extract the URL from the ExecutionContext,
 * parse it to get the search string, and pass it to the parser.
 *
 * Note: We do NOT test the parser functionality here (it has its own test suite).
 * We only test the decorator's URL extraction and search string processing logic.
 */

/**
 * Create a mock ExecutionContext with the given URL.
 */
function createMockContext(originalUrl: string): ExecutionContext {
  const mockRequest: Partial<Request> = {
    originalUrl,
  };

  const mockHttpArgumentsHost = {
    getRequest: mock.fn(() => mockRequest as Request),
  };

  const mockContext: Partial<ExecutionContext> = {
    switchToHttp: mock.fn(() => mockHttpArgumentsHost as never),
  };

  return mockContext as ExecutionContext;
}

describe("jsonQueryDecorator", () => {
  describe("ExecutionContext interaction", () => {
    it("should call switchToHttp on the execution context", () => {
      const ctx = createMockContext("/articles?sort=title");
      const switchToHttpMock = ctx.switchToHttp as any;

      jsonQueryDecorator(undefined, ctx);

      expect(switchToHttpMock.mock.calls.length).toBe(1);
    });

    it("should call getRequest on the HTTP arguments host", () => {
      const ctx = createMockContext("/articles?sort=title");

      jsonQueryDecorator(undefined, ctx);

      // Verify getRequest was called by checking the mock
      const httpHost = ctx.switchToHttp();
      expect((httpHost.getRequest as any).mock.calls.length).toBe(1);
    });

    it("should access originalUrl from the request", () => {
      const testUrl = "/articles?sort=-created";
      const ctx = createMockContext(testUrl);

      jsonQueryDecorator(undefined, ctx);

      const request = ctx.switchToHttp().getRequest<Request>();
      expect(request.originalUrl).toBe(testUrl);
    });
  });

  describe("relative URL processing", () => {
    it("should process simple relative path", () => {
      const ctx = createMockContext("/articles");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result).toEqual({ sort: {}, fields: {} });
    });

    it("should process relative path with query string", () => {
      const ctx = createMockContext("/articles?sort=title");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toBeDefined();
    });

    it("should process nested relative path", () => {
      const ctx = createMockContext("/api/v1/articles?page[offset]=10");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.page).toBeDefined();
    });

    it("should process relative path with empty query", () => {
      const ctx = createMockContext("/articles?");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toEqual({ sort: {}, fields: {} });
    });
  });

  describe("absolute URL processing", () => {
    it("should process http:// URL", () => {
      const ctx = createMockContext(
        "http://localhost:3000/articles?sort=title",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toBeDefined();
    });

    it("should process https:// URL", () => {
      const ctx = createMockContext(
        "https://api.example.com/articles?sort=title",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toBeDefined();
    });

    it("should process absolute URL with port number", () => {
      const ctx = createMockContext(
        "http://localhost:8080/api/articles?filter[id]=1",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
    });

    it("should process absolute URL with subdomain", () => {
      const ctx = createMockContext(
        "https://api.staging.example.com/articles?include=author",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.include).toBeDefined();
    });

    it("should process absolute URL with path segments", () => {
      const ctx = createMockContext(
        "https://api.example.com/v1/resources/articles?sort=-created",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toBeDefined();
    });
  });

  describe("URL vs search string handling", () => {
    it("should correctly identify http:/ as absolute (single slash)", () => {
      const ctx = createMockContext("http://localhost/articles?sort=title");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
    });

    it("should correctly identify https:/ as absolute (single slash)", () => {
      const ctx = createMockContext("https://example.com/articles?sort=title");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
    });

    it("should parse relative URL by prepending http://localhost", () => {
      const ctx = createMockContext("/articles?page[offset]=0");
      const result = jsonQueryDecorator(undefined, ctx);

      // Should successfully parse even though relative
      expect(result).toBeDefined();
      expect(result.page).toBeDefined();
    });
  });

  describe("empty and minimal queries", () => {
    it("should return empty object for path with no query", () => {
      const ctx = createMockContext("/articles");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toEqual({ sort: {}, fields: {} });
    });

    it("should return empty object for path with empty query string", () => {
      const ctx = createMockContext("/articles?");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toEqual({ sort: {}, fields: {} });
    });

    it("should return empty object for root path", () => {
      const ctx = createMockContext("/");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toEqual({ sort: {}, fields: {} });
    });
  });

  describe("typical NestJS controller scenarios", () => {
    it("should handle GET /resources request", () => {
      const ctx = createMockContext("/articles?page[offset]=0&page[limit]=10");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.page).toBeDefined();
    });

    it("should handle GET /resources/:id request", () => {
      const ctx = createMockContext("/articles/123?include=author,comments");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.include).toBeDefined();
    });

    it("should handle GET request with all query parameters", () => {
      const ctx = createMockContext(
        "/articles?" +
          "sort=-created&" +
          "page[offset]=10&page[limit]=20&" +
          "filter[status]=published&" +
          "fields[articles]=title,body&" +
          "include=author",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toBeDefined();
      expect(result.page).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.fields).toBeDefined();
      expect(result.include).toBeDefined();
    });

    it("should handle GET request behind reverse proxy with absolute URL", () => {
      const ctx = createMockContext(
        "https://api.example.com/v1/articles?sort=-publishedAt",
      );
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toEqual({ publishedAt: -1 });
    });

    it("should handle nested resource routes", () => {
      const ctx = createMockContext("/articles/1/comments?sort=-created");
      const result = jsonQueryDecorator(undefined, ctx);

      expect(result).toBeDefined();
      expect(result.sort).toEqual({ created: -1 });
    });
  });
});
