import { describe, it } from "node:test";
import expect from "expect";
import {
  type CursorPagination,
  type JsonApiQuery,
  type JsonApiQueryFields,
  type JsonApiQueryFilter,
  type JsonApiQuerySorting,
  type OffsetPagination,
  parser,
} from "./parser";

describe("parser", () => {
  describe("empty and basic queries", () => {
    it("should return empty object for empty string", () => {
      const result = parser("");
      expect(result).toEqual({});
    });

    it("should handle query string with no JSON:API parameters", () => {
      const result = parser("foo=bar&baz=qux");
      expect(result).toHaveProperty("foo", "bar");
      expect(result).toHaveProperty("baz", "qux");
    });
  });

  describe("sort parameter", () => {
    it("should parse single ascending sort field", () => {
      const result = parser("sort=title");
      expect(result.sort).toEqual({ title: 1 });
    });

    it("should parse single descending sort field", () => {
      const result = parser("sort=-created");
      expect(result.sort).toEqual({ created: -1 });
    });

    it("should parse multiple sort fields", () => {
      const result = parser("sort=-created,title,author");
      expect(result.sort).toEqual({
        created: -1,
        title: 1,
        author: 1,
      });
    });

    it("should parse mixed ascending and descending sort", () => {
      const result = parser("sort=-created,title,-views");
      expect(result.sort).toEqual({
        created: -1,
        title: 1,
        views: -1,
      });
    });

    it("should handle sort with whitespace", () => {
      const result = parser("sort=-created, title, -views");
      expect(result.sort).toEqual({
        created: -1,
        title: 1,
        views: -1,
      });
    });

    it("should handle empty sort fields", () => {
      const result = parser("sort=title,,author");
      expect(result.sort).toEqual({
        title: 1,
        author: 1,
      });
    });
  });

  describe("page parameter - offset pagination", () => {
    it("should parse offset and limit", () => {
      const result = parser("page[offset]=20&page[limit]=10");
      expect(result.page).toEqual({
        offset: 20,
        limit: 10,
      });
    });

    it("should default offset to 0 if not provided", () => {
      const result = parser("page[limit]=10");
      expect(result.page).toEqual({
        offset: 0,
        limit: 10,
      });
    });

    it("should default limit to 10 if not provided", () => {
      const result = parser("page[offset]=20");
      expect(result.page).toEqual({
        offset: 20,
        limit: 10,
      });
    });

    it("should handle zero offset", () => {
      const result = parser("page[offset]=0&page[limit]=5");
      expect(result.page).toEqual({
        offset: 0,
        limit: 5,
      });
    });

    it("should parse string numbers correctly", () => {
      const result = parser("page[offset]=100&page[limit]=50");
      const page = result.page as OffsetPagination;
      expect(typeof page.offset).toBe("number");
      expect(typeof page.limit).toBe("number");
      expect(page.offset).toBe(100);
      expect(page.limit).toBe(50);
    });
  });

  describe("page parameter - cursor pagination", () => {
    it("should parse cursor and limit", () => {
      const result = parser("page[cursor]=eyJpZCI6MTAwfQ==&page[limit]=20");
      expect(result.page).toEqual({
        cursor: "eyJpZCI6MTAwfQ==",
        field: "id",
        limit: 20,
      });
    });

    it("should prefer cursor over offset when both present", () => {
      const result = parser(
        "page[cursor]=abc123&page[offset]=20&page[limit]=10",
      );
      const page = result.page as CursorPagination;
      expect(page).toHaveProperty("cursor", "abc123");
      expect(page).toHaveProperty("field", "id");
      expect(page).toHaveProperty("limit", 10);
    });

    it("should default limit to 10 if not provided with cursor", () => {
      const result = parser("page[cursor]=abc123");
      expect(result.page).toEqual({
        cursor: "abc123",
        field: "id",
        limit: 10,
      });
    });

    it("should handle complex cursor strings", () => {
      const cursor =
        "eyJpZCI6MTAwLCJ0aW1lc3RhbXAiOiIyMDI0LTAxLTE1VDEwOjAwOjAwWiJ9";
      const result = parser(`page[cursor]=${cursor}&page[limit]=15`);
      expect(result.page).toEqual({
        cursor,
        field: "id",
        limit: 15,
      });
    });
  });

  describe("filter parameter", () => {
    it("should parse single filter field", () => {
      const result = parser("filter[status]=published");
      expect(result.filter).toEqual({
        status: "published",
      });
    });

    it("should parse multiple filter fields", () => {
      const result = parser("filter[status]=published&filter[author]=john");
      expect(result.filter).toEqual({
        status: "published",
        author: "john",
      });
    });

    it("should parse nested filter fields", () => {
      const result = parser(
        "filter[created][gte]=2024-01-01&filter[created][lte]=2024-12-31",
      );
      expect(result.filter).toEqual({
        created: {
          gte: "2024-01-01",
          lte: "2024-12-31",
        },
      });
    });

    it("should handle complex filter structures", () => {
      const result = parser(
        "filter[status]=published&filter[author][name]=john&filter[author][verified]=true",
      );
      expect(result.filter).toEqual({
        status: "published",
        author: {
          name: "john",
          verified: "true",
        },
      });
    });

    it("should handle filter with special characters", () => {
      const result = parser(
        "filter[title]=Hello%20World&filter[tag]=API%2FREST",
      );
      expect(result.filter).toEqual({
        title: "Hello World",
        tag: "API/REST",
      });
    });

    it("should handle empty filter object", () => {
      const result = parser("filter=");
      expect(result.filter).toBeUndefined();
    });
  });

  describe("fields parameter", () => {
    it("should parse single resource type fields", () => {
      const result = parser("fields[articles]=title,body");
      expect(result.fields).toEqual({
        articles: {
          title: 1,
          body: 1,
        },
      });
    });

    it("should parse multiple resource type fields", () => {
      const result = parser(
        "fields[articles]=title,body&fields[people]=name,email",
      );
      expect(result.fields).toEqual({
        articles: {
          title: 1,
          body: 1,
        },
        people: {
          name: 1,
          email: 1,
        },
      });
    });

    it("should parse single field for resource type", () => {
      const result = parser("fields[articles]=title");
      expect(result.fields).toEqual({
        articles: {
          title: 1,
        },
      });
    });

    it("should handle fields with whitespace", () => {
      const result = parser("fields[articles]=title, body, author");
      expect(result.fields).toEqual({
        articles: {
          title: 1,
          body: 1,
          author: 1,
        },
      });
    });

    it("should handle empty fields in comma list", () => {
      const result = parser("fields[articles]=title,,body");
      expect(result.fields).toEqual({
        articles: {
          title: 1,
          body: 1,
        },
      });
    });

    it("should handle field names with hyphens and underscores", () => {
      const result = parser(
        "fields[articles]=published-date,author_name,meta-data",
      );
      expect(result.fields).toEqual({
        articles: {
          "published-date": 1,
          "author_name": 1,
          "meta-data": 1,
        },
      });
    });
  });

  describe("include parameter", () => {
    it("should parse single include relationship", () => {
      const result = parser("include=author");
      expect(result.include).toEqual(["author"]);
    });

    it("should parse multiple include relationships", () => {
      const result = parser("include=author,comments");
      expect(result.include).toEqual(["author", "comments"]);
    });

    it("should parse nested include relationships", () => {
      const result = parser("include=author,comments.author");
      expect(result.include).toEqual(["author", "comments.author"]);
    });

    it("should parse deeply nested relationships", () => {
      const result = parser("include=author,comments.author.profile,tags");
      expect(result.include).toEqual([
        "author",
        "comments.author.profile",
        "tags",
      ]);
    });

    it("should handle include with whitespace", () => {
      const result = parser("include=author, comments, tags");
      expect(result.include).toEqual(["author", "comments", "tags"]);
    });

    it("should handle empty include values", () => {
      const result = parser("include=author,,comments");
      expect(result.include).toEqual(["author", "comments"]);
    });

    it("should handle relationship names with hyphens", () => {
      const result = parser("include=primary-author,related-posts");
      expect(result.include).toEqual(["primary-author", "related-posts"]);
    });
  });

  describe("combined parameters", () => {
    it("should parse all parameters together", () => {
      const result = parser(
        "sort=-created,title&" +
          "page[offset]=20&page[limit]=10&" +
          "filter[status]=published&" +
          "fields[articles]=title,body&" +
          "include=author,comments",
      );

      expect(result.sort).toEqual({ created: -1, title: 1 });
      expect(result.page).toEqual({ offset: 20, limit: 10 });
      expect(result.filter).toEqual({ status: "published" });
      expect(result.fields).toEqual({
        articles: { title: 1, body: 1 },
      });
      expect(result.include).toEqual(["author", "comments"]);
    });

    it("should parse complex real-world query", () => {
      const result = parser(
        "sort=-publishedAt,title&" +
          "page[offset]=0&page[limit]=25&" +
          "filter[status]=published&filter[category]=tech&filter[tags][any]=api,rest&" +
          "fields[articles]=title,body,publishedAt,slug&fields[people]=name,email&" +
          "include=author,comments.author,category",
      );

      expect(result.sort).toEqual({ publishedAt: -1, title: 1 });
      expect(result.page).toEqual({ offset: 0, limit: 25 });
      expect(result.filter).toEqual({
        status: "published",
        category: "tech",
        tags: { any: "api,rest" },
      });
      expect(result.fields).toEqual({
        articles: { title: 1, body: 1, publishedAt: 1, slug: 1 },
        people: { name: 1, email: 1 },
      });
      expect(result.include).toEqual(["author", "comments.author", "category"]);
    });

    it("should preserve custom query parameters", () => {
      const result = parser(
        "sort=-created&" +
          "page[offset]=10&" +
          "customParam=value&" +
          "anotherParam=123",
      );

      expect(result.sort).toBeDefined();
      expect(result.page).toBeDefined();
      expect(result).toHaveProperty("customParam", "value");
      expect(result).toHaveProperty("anotherParam", "123");
    });
  });

  describe("edge cases", () => {
    it("should handle URL-encoded characters", () => {
      const result = parser("filter[title]=Hello%20World%21&sort=created%2Cat");
      expect(result.filter).toEqual({ title: "Hello World!" });
      // Note: The comma in sort will be decoded but treated as field separator
    });

    it("should handle parameter without value", () => {
      const result = parser("sort=&filter[status]=published");
      expect(result.filter).toEqual({ status: "published" });
    });

    it("should handle repeated parameters", () => {
      const result = parser("filter[tag]=api&filter[tag]=rest");
      // qs library typically takes the last value or creates an array
      expect(result.filter).toBeDefined();
    });

    it("should handle deeply nested filter structures", () => {
      const result = parser(
        "filter[meta][tags][include][any]=tech&" +
          "filter[meta][tags][exclude][all]=draft",
      );
      expect(result.filter).toEqual({
        meta: {
          tags: {
            include: { any: "tech" },
            exclude: { all: "draft" },
          },
        },
      });
    });

    it("should handle very long query strings", () => {
      const fields = Array.from({ length: 50 }, (_, i) => `field${i}`).join(
        ",",
      );
      const result = parser(`fields[articles]=${fields}`);
      expect(Object.keys(result.fields!.articles)).toHaveLength(50);
    });

    it("should handle special field names", () => {
      const result = parser("fields[articles]=id,type,meta,links");
      expect(result.fields).toEqual({
        articles: {
          id: 1,
          type: 1,
          meta: 1,
          links: 1,
        },
      });
    });

    it("should parse numeric-like filter values as strings", () => {
      const result = parser("filter[age]=25&filter[score][gte]=90");
      expect(result.filter).toEqual({
        age: "25",
        score: { gte: "90" },
      });
      // Values are strings, not numbers, as they come from query parameters
      expect(typeof (result.filter as any).age).toBe("string");
    });

    it("should parse boolean-like filter values as strings", () => {
      const result = parser("filter[published]=true&filter[featured]=false");
      expect(result.filter).toEqual({
        published: "true",
        featured: "false",
      });
      // Values are strings, not booleans, as they come from query parameters
      expect(typeof (result.filter as any).published).toBe("string");
    });
  });

  describe("type checking", () => {
    it("should return correct page type for offset pagination", () => {
      const result = parser("page[offset]=10&page[limit]=20");
      const page = result.page as OffsetPagination;

      expect(page).toHaveProperty("offset");
      expect(page).toHaveProperty("limit");
      expect(page).not.toHaveProperty("cursor");
    });

    it("should return correct page type for cursor pagination", () => {
      const result = parser("page[cursor]=abc&page[limit]=20");
      const page = result.page as CursorPagination;

      expect(page).toHaveProperty("cursor");
      expect(page).toHaveProperty("limit");
      expect(page).not.toHaveProperty("offset");
    });

    it("should return properly typed sort object", () => {
      const result = parser("sort=-created,title");
      const sort = result.sort!;

      expect(sort.created).toBe(-1);
      expect(sort.title).toBe(1);
    });
  });

  describe("real-world examples", () => {
    it("should parse blog API query", () => {
      const result = parser(
        "sort=-publishedAt&" +
          "page[offset]=0&page[limit]=10&" +
          "filter[status]=published&filter[author]=john-doe&" +
          "fields[posts]=title,excerpt,publishedAt,author&" +
          "fields[users]=name,avatar&" +
          "include=author,comments",
      );

      expect(result).toMatchObject({
        sort: { publishedAt: -1 },
        page: { offset: 0, limit: 10 },
        filter: { status: "published", author: "john-doe" },
        fields: {
          posts: { title: 1, excerpt: 1, publishedAt: 1, author: 1 },
          users: { name: 1, avatar: 1 },
        },
        include: ["author", "comments"],
      });
    });

    it("should parse e-commerce product query", () => {
      const result = parser(
        "sort=price,-rating&" +
          "page[offset]=20&page[limit]=24&" +
          "filter[category]=electronics&" +
          "filter[price][gte]=100&filter[price][lte]=500&" +
          "filter[inStock]=true&" +
          "fields[products]=name,price,image,rating&" +
          "include=category,reviews",
      );

      expect(result.sort).toEqual({ price: 1, rating: -1 });
      expect(result.page).toEqual({ offset: 20, limit: 24 });
      expect(result.filter).toMatchObject({
        category: "electronics",
        price: { gte: "100", lte: "500" },
        inStock: "true",
      });
    });

    it("should parse social media feed query", () => {
      const result = parser(
        "sort=-createdAt&" +
          "page[cursor]=eyJpZCI6MTIzfQ&page[limit]=20&" +
          "filter[visibility]=public&" +
          "fields[posts]=content,createdAt,likesCount,commentsCount&" +
          "fields[users]=username,displayName,avatar&" +
          "include=author,mentions,media",
      );

      expect(result.sort).toEqual({ createdAt: -1 });
      expect(result.page).toEqual({ cursor: "eyJpZCI6MTIzfQ", field: "id", limit: 20 });
      expect(result.include).toEqual(["author", "mentions", "media"]);
    });
  });
});
