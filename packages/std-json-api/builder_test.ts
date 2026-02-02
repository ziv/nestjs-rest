import { describe, it } from "node:test";
import expect from "expect";
import {
  JsonApiBaseBuilder,
  JsonApiCollectionDocumentBuilder,
  JsonApiDocumentBuilder,
  JsonApiErrorDocumentBuilder,
  JsonApiResourceBuilder,
} from "./builder";
import {
  ErrorObject,
  JsonApiDocumentBase,
  ResourceIdentifierObject,
  ResourceObject,
} from "./json-api";

describe("JsonApiBaseBuilder", () => {
  it("should create a document with default jsonapi version", () => {
    const builder = new JsonApiBaseBuilder<JsonApiDocumentBase>();
    const doc = builder.build();

    expect(doc).toEqual({
      jsonapi: {
        version: "1.0",
      },
      links: {},
    });
  });

  it("should set metadata", () => {
    const builder = new JsonApiBaseBuilder<JsonApiDocumentBase>();
    const meta = { total: 100, page: 1, copyright: "2024 Example Corp" };

    const doc = builder.metadata(meta).build();

    expect(doc.meta).toEqual(meta);
  });

  it("should set links", () => {
    const builder = new JsonApiBaseBuilder<JsonApiDocumentBase>();
    const links = {
      self: "/articles",
      first: "/articles?page[offset]=0",
      last: "/articles?page[offset]=90",
    };

    const doc = builder.links(links).build();

    expect(doc.links).toEqual(links);
  });

  it("should support method chaining", () => {
    const builder = new JsonApiBaseBuilder<JsonApiDocumentBase>();
    const meta = { total: 50 };
    const links = { self: "/articles" };

    const doc = builder
      .metadata(meta)
      .links(links)
      .build();

    expect(doc.meta).toEqual(meta);
    expect(doc.links).toEqual(links);
    expect(doc.jsonapi).toEqual({ version: "1.0" });
  });

  it("should handle link objects with metadata", () => {
    const builder = new JsonApiBaseBuilder<JsonApiDocumentBase>();
    const links = {
      self: "/articles/1",
      related: {
        href: "/articles/1/comments",
        title: "Comments",
        meta: { count: 10 },
      },
    };

    const doc = builder.links(links).build();

    expect(doc.links).toEqual(links);
  });

  it("should handle pagination links", () => {
    const builder = new JsonApiBaseBuilder<JsonApiDocumentBase>();
    const links = {
      self: "/articles?page[offset]=10&page[limit]=10",
      first: "/articles?page[offset]=0&page[limit]=10",
      prev: "/articles?page[offset]=0&page[limit]=10",
      next: "/articles?page[offset]=20&page[limit]=10",
      last: "/articles?page[offset]=90&page[limit]=10",
    };

    const doc = builder.links(links).build();

    expect(doc.links).toEqual(links);
  });
});

describe("JsonApiResourceBuilder", () => {
  describe("constructor", () => {
    it("should create a resource with type and id", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const resource = builder.build();

      expect(resource.type).toBe("articles");
      expect(resource.id).toBe("1");
    });

    it("should create a resource with only type (for new resources)", () => {
      const builder = new JsonApiResourceBuilder("articles");
      const resource = builder.build();

      expect(resource.type).toBe("articles");
      expect(resource.id).toBeUndefined();
    });
  });

  describe("lid", () => {
    it("should set a local identifier", () => {
      const builder = new JsonApiResourceBuilder("articles");
      const resource = builder.lid("temp-article-1").build();

      expect(resource.lid).toBe("temp-article-1");
    });

    it("should work with type but without id", () => {
      const builder = new JsonApiResourceBuilder("articles");
      const resource = builder.lid("local-123").build();

      expect(resource.type).toBe("articles");
      expect(resource.id).toBeUndefined();
      expect(resource.lid).toBe("local-123");
    });
  });

  describe("attributes", () => {
    it("should set simple attributes", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const attributes = {
        title: "Hello World",
        body: "This is the content",
      };

      const resource = builder.attributes(attributes).build();

      expect(resource.attributes).toEqual(attributes);
    });

    it("should set complex nested attributes", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const attributes = {
        title: "Complex Article",
        metadata: {
          tags: ["javascript", "typescript"],
          settings: {
            published: true,
            featured: false,
          },
        },
        stats: {
          views: 1000,
          likes: 50,
        },
      };

      const resource = builder.attributes(attributes).build();

      expect(resource.attributes).toEqual(attributes);
    });

    it("should handle attributes with various data types", () => {
      const builder = new JsonApiResourceBuilder("products", "100");
      const attributes = {
        name: "Widget",
        price: 99.99,
        inStock: true,
        quantity: 42,
        tags: ["electronics", "gadgets"],
        specs: {
          weight: 1.5,
          dimensions: [10, 20, 5],
        },
      };

      const resource = builder.attributes(attributes).build();

      expect(resource.attributes).toEqual(attributes);
    });
  });

  describe("relationships", () => {
    it("should set a to-one relationship", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const relationships = {
        author: {
          data: { type: "people", id: "9" },
        },
      };

      const resource = builder.relationships(relationships).build();

      expect(resource.relationships).toEqual(relationships);
    });

    it("should set a to-many relationship", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const relationships = {
        comments: {
          data: [
            { type: "comments", id: "5" },
            { type: "comments", id: "12" },
          ],
        },
      };

      const resource = builder.relationships(relationships).build();

      expect(resource.relationships).toEqual(relationships);
    });

    it("should set relationships with links", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const relationships = {
        author: {
          links: {
            self: "/articles/1/relationships/author",
            related: "/articles/1/author",
          },
          data: { type: "people", id: "9" },
        },
      };

      const resource = builder.relationships(relationships).build();

      expect(resource.relationships).toEqual(relationships);
    });

    it("should set multiple relationships", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const relationships = {
        author: {
          data: { type: "people", id: "9" },
        },
        comments: {
          data: [
            { type: "comments", id: "5" },
            { type: "comments", id: "12" },
          ],
        },
        category: {
          data: { type: "categories", id: "tech" },
        },
      };

      const resource = builder.relationships(relationships).build();

      expect(resource.relationships).toEqual(relationships);
    });

    it("should set an empty to-one relationship (null)", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const relationships = {
        author: {
          data: null,
        },
      };

      const resource = builder.relationships(relationships).build();

      expect(resource.relationships?.author.data).toBeNull();
    });

    it("should set an empty to-many relationship (empty array)", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const relationships = {
        comments: {
          data: [],
        },
      };

      const resource = builder.relationships(relationships).build();

      expect(resource.relationships?.comments.data).toEqual([]);
    });
  });

  describe("links", () => {
    it("should set a self link", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const links = {
        self: "https://example.com/articles/1",
      };

      const resource = builder.links(links).build();

      expect(resource.links).toEqual(links);
    });

    it("should set multiple links", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const links = {
        self: "/articles/1",
        canonical: "https://example.com/articles/1",
        preview: "/articles/1/preview",
      };

      const resource = builder.links(links).build();

      expect(resource.links).toEqual(links);
    });

    it("should set link objects with metadata", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const links = {
        self: "/articles/1",
        related: {
          href: "/articles/1/related",
          meta: { count: 5 },
        },
      };

      const resource = builder.links(links).build();

      expect(resource.links).toEqual(links);
    });
  });

  describe("meta", () => {
    it("should set simple meta information", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const meta = {
        views: 1024,
        created: "2024-01-15T10:00:00Z",
      };

      const resource = builder.meta(meta).build();

      expect(resource.meta).toEqual(meta);
    });

    it("should set complex nested meta information", () => {
      const builder = new JsonApiResourceBuilder("articles", "1");
      const meta = {
        timestamps: {
          created: "2024-01-15T10:00:00Z",
          updated: "2024-01-20T14:30:00Z",
          published: "2024-01-16T08:00:00Z",
        },
        analytics: {
          views: 1024,
          uniqueVisitors: 750,
          avgReadTime: 180,
        },
        flags: {
          featured: true,
          pinned: false,
        },
      };

      const resource = builder.meta(meta).build();

      expect(resource.meta).toEqual(meta);
    });
  });

  describe("method chaining", () => {
    it("should support chaining all methods", () => {
      const result = new JsonApiResourceBuilder("articles", "1")
        .attributes({ title: "Test" })
        .relationships({ author: { data: { type: "people", id: "9" } } })
        .links({ self: "/articles/1" })
        .meta({ views: 100 });

      expect(result).toBeInstanceOf(JsonApiResourceBuilder);
    });

    it("should build a complete resource with all properties", () => {
      const resource = new JsonApiResourceBuilder("articles", "1")
        .attributes({
          title: "Complete Article",
          body: "Full content here",
        })
        .relationships({
          author: {
            data: { type: "people", id: "9" },
            links: {
              self: "/articles/1/relationships/author",
              related: "/articles/1/author",
            },
          },
          comments: {
            data: [
              { type: "comments", id: "5" },
              { type: "comments", id: "12" },
            ],
          },
        })
        .links({
          self: "https://example.com/articles/1",
        })
        .meta({
          views: 1024,
          created: "2024-01-15T10:00:00Z",
        })
        .build();

      expect(resource).toHaveProperty("type", "articles");
      expect(resource).toHaveProperty("id", "1");
      expect(resource).toHaveProperty("attributes");
      expect(resource).toHaveProperty("relationships");
      expect(resource).toHaveProperty("links");
      expect(resource).toHaveProperty("meta");
    });

    it("should build a minimal resource with only type and id", () => {
      const resource = new JsonApiResourceBuilder("articles", "1").build();

      expect(resource.type).toBe("articles");
      expect(resource.id).toBe("1");
      expect(resource.attributes).toBeUndefined();
      expect(resource.relationships).toBeUndefined();
      expect(resource.links).toBeUndefined();
      expect(resource.meta).toBeUndefined();
    });
  });

  describe("integration with document builders", () => {
    it("should be usable with JsonApiDocumentBuilder", () => {
      const resource = new JsonApiResourceBuilder("articles", "1")
        .attributes({ title: "Test Article" })
        .build();

      const doc = new JsonApiDocumentBuilder(resource).build();

      expect(doc.data).toEqual(resource);
    });

    it("should be usable with JsonApiCollectionDocumentBuilder", () => {
      const resource1 = new JsonApiResourceBuilder("articles", "1")
        .attributes({ title: "First" })
        .build();

      const resource2 = new JsonApiResourceBuilder("articles", "2")
        .attributes({ title: "Second" })
        .build();

      const doc = new JsonApiCollectionDocumentBuilder([resource1, resource2])
        .build();

      expect(doc.data).toHaveLength(2);
      expect(doc.data[0]).toEqual(resource1);
      expect(doc.data[1]).toEqual(resource2);
    });
  });

  describe("real-world scenarios", () => {
    it("should build a blog post resource", () => {
      const resource = new JsonApiResourceBuilder("posts", "42")
        .attributes({
          title: "Getting Started with JSON:API",
          slug: "getting-started-jsonapi",
          body: "JSON:API is a specification...",
          publishedAt: "2024-01-15T10:00:00Z",
          status: "published",
        })
        .relationships({
          author: {
            data: { type: "users", id: "9" },
            links: {
              self: "/posts/42/relationships/author",
              related: "/posts/42/author",
            },
          },
          comments: {
            data: [
              { type: "comments", id: "100" },
              { type: "comments", id: "101" },
            ],
            links: {
              self: "/posts/42/relationships/comments",
              related: "/posts/42/comments",
            },
            meta: { count: 2 },
          },
          tags: {
            data: [
              { type: "tags", id: "api" },
              { type: "tags", id: "rest" },
            ],
          },
        })
        .links({
          self: "/posts/42",
        })
        .meta({
          views: 5000,
          likes: 250,
          shares: 50,
        })
        .build();

      expect(resource.type).toBe("posts");
      expect(resource.id).toBe("42");
      expect(resource.attributes?.title).toBe("Getting Started with JSON:API");
      expect(resource.relationships?.author.data).toEqual({
        type: "users",
        id: "9",
      });
      expect(resource.relationships?.comments.data).toHaveLength(2);
      expect(resource.links?.self).toBe("/posts/42");
      expect(resource.meta?.views).toBe(5000);
    });

    it("should build a product resource with inventory details", () => {
      const resource = new JsonApiResourceBuilder("products", "widget-123")
        .attributes({
          name: "Premium Widget",
          description: "The best widget on the market",
          price: 99.99,
          currency: "USD",
          sku: "WDG-PREM-001",
          inStock: true,
          quantity: 150,
          specifications: {
            weight: "1.5kg",
            dimensions: {
              length: 10,
              width: 5,
              height: 3,
            },
            color: "blue",
            material: "aluminum",
          },
        })
        .relationships({
          category: {
            data: { type: "categories", id: "electronics" },
          },
          manufacturer: {
            data: { type: "companies", id: "acme-corp" },
          },
          relatedProducts: {
            data: [
              { type: "products", id: "widget-124" },
              { type: "products", id: "widget-125" },
            ],
          },
        })
        .links({
          self: "/products/widget-123",
          image: "https://cdn.example.com/products/widget-123.jpg",
        })
        .meta({
          rating: 4.5,
          reviewCount: 127,
          bestseller: true,
        })
        .build();

      expect(resource.type).toBe("products");
      expect(resource.attributes?.price).toBe(99.99);
      // @ts-ignore
      expect(resource.attributes?.specifications.dimensions.length).toBe(10);
      expect(resource.relationships?.relatedProducts.data).toHaveLength(2);
      expect(resource.meta?.bestseller).toBe(true);
    });

    it("should build a new resource without ID for creation", () => {
      const resource = new JsonApiResourceBuilder("articles")
        .lid("temp-new-article")
        .attributes({
          title: "Brand New Article",
          body: "This article is being created",
        })
        .relationships({
          author: {
            data: { type: "people", id: "9" },
          },
        })
        .build();

      expect(resource.type).toBe("articles");
      expect(resource.id).toBeUndefined();
      expect(resource.lid).toBe("temp-new-article");
      expect(resource.attributes?.title).toBe("Brand New Article");
    });
  });
});

describe("JsonApiDocumentBuilder", () => {
  describe("data", () => {
    it("should set a resource object as primary data", () => {
      const resource: ResourceObject = {
        type: "articles",
        id: "1",
        attributes: {
          title: "JSON:API paints my bikeshed!",
          body: "The shortest article. Ever.",
        },
      };

      const doc = new JsonApiDocumentBuilder(resource).build();

      expect(doc.data).toEqual(resource);
    });

    it("should set a resource identifier as primary data", () => {
      const identifier: ResourceIdentifierObject = {
        type: "articles",
        id: "1",
      };

      const doc = new JsonApiDocumentBuilder(identifier).build();

      expect(doc.data).toEqual(identifier);
    });

    it("should set null as primary data", () => {
      const doc = new JsonApiDocumentBuilder(null).build();

      expect(doc.data).toBeNull();
    });

    it("should handle resource with relationships", () => {
      const resource: ResourceObject = {
        type: "articles",
        id: "1",
        attributes: {
          title: "Rails is Omakase",
        },
        relationships: {
          author: {
            data: { type: "people", id: "9" },
            links: {
              self: "/articles/1/relationships/author",
              related: "/articles/1/author",
            },
          },
        },
      };

      const doc = new JsonApiDocumentBuilder(resource).build();

      expect(doc.data).toEqual(resource);
    });

    it("should handle resource with links", () => {
      const resource: ResourceObject = {
        type: "articles",
        id: "1",
        attributes: { title: "Test" },
        links: {
          self: "https://example.com/articles/1",
        },
      };

      const doc = new JsonApiDocumentBuilder(resource).build();

      expect(doc.data).toEqual(resource);
    });

    it("should handle resource with meta", () => {
      const resource: ResourceObject = {
        type: "articles",
        id: "1",
        attributes: { title: "Test" },
        meta: {
          created: "2024-01-01",
          views: 1024,
        },
      };

      const doc = new JsonApiDocumentBuilder(resource).build();

      expect(doc.data).toEqual(resource);
    });

    it("should handle resource with lid for new resources", () => {
      const resource: ResourceObject = {
        type: "articles",
        lid: "temp-1",
        attributes: { title: "New Article" },
      };

      const doc = new JsonApiDocumentBuilder(resource).build();

      expect(doc.data).toEqual(resource);
    });
  });

  describe("included", () => {
    it("should set included resources", () => {
      const included: ResourceObject[] = [
        {
          type: "people",
          id: "9",
          attributes: {
            firstName: "Dan",
            lastName: "Gebhardt",
            twitter: "dgeb",
          },
        },
        {
          type: "comments",
          id: "5",
          attributes: {
            body: "First!",
          },
        },
      ];

      const doc = new JsonApiDocumentBuilder({ type: "articles", id: "1" })
        .included(included)
        .build();

      expect(doc.included).toEqual(included);
    });

    it("should set empty included array", () => {
      const doc = new JsonApiDocumentBuilder({ type: "articles", id: "1" })
        .included([])
        .build();

      expect(doc.included).toEqual([]);
    });
  });

  describe("complete document", () => {
    it("should build a complete single resource document", () => {
      const doc = new JsonApiDocumentBuilder({
        type: "articles",
        id: "1",
        attributes: {
          title: "JSON:API paints my bikeshed!",
        },
        relationships: {
          author: {
            data: { type: "people", id: "9" },
          },
        },
      })
        .included([
          {
            type: "people",
            id: "9",
            attributes: {
              firstName: "Dan",
              lastName: "Gebhardt",
            },
          },
        ])
        .links({ self: "/articles/1" })
        .metadata({ views: 1024 })
        .build();

      expect(doc).toHaveProperty("data");
      expect(doc).toHaveProperty("included");
      expect(doc).toHaveProperty("links");
      expect(doc).toHaveProperty("meta");
      expect(doc).toHaveProperty("jsonapi");
      expect(doc.jsonapi?.version).toBe("1.0");
    });

    it("should build a document with only data", () => {
      const doc = new JsonApiDocumentBuilder({
        type: "articles",
        id: "1",
        attributes: { title: "Minimal" },
      }).build();

      expect(doc.data).toBeDefined();
      expect(doc.included).toBeUndefined();
    });
  });

  describe("method chaining", () => {
    it("should support chaining all methods", () => {
      const result = new JsonApiDocumentBuilder({
        type: "articles",
        id: "1",
        attributes: { title: "Test" },
      })
        .included([{ type: "people", id: "1", attributes: { name: "John" } }])
        .links({ self: "/articles/1" })
        .metadata({ total: 1 });

      expect(result).toBeInstanceOf(JsonApiDocumentBuilder);
    });
  });
});

describe("JsonApiCollectionDocumentBuilder", () => {
  describe("data", () => {
    it("should set an array of resource objects as primary data", () => {
      const resources: ResourceObject[] = [
        {
          type: "articles",
          id: "1",
          attributes: { title: "First Article" },
        },
        {
          type: "articles",
          id: "2",
          attributes: { title: "Second Article" },
        },
      ];

      const doc = new JsonApiCollectionDocumentBuilder(resources).build();

      expect(doc.data).toEqual(resources);
      expect(Array.isArray(doc.data)).toBe(true);
      expect(doc.data).toHaveLength(2);
    });

    it("should set an array of resource identifiers as primary data", () => {
      const identifiers: ResourceIdentifierObject[] = [
        { type: "articles", id: "1" },
        { type: "articles", id: "2" },
        { type: "articles", id: "3" },
      ];

      const doc = new JsonApiCollectionDocumentBuilder(identifiers).build();

      expect(doc.data).toEqual(identifiers);
      expect(Array.isArray(doc.data)).toBe(true);
      expect(doc.data).toHaveLength(3);
    });

    it("should set an empty array as primary data", () => {
      const doc = new JsonApiCollectionDocumentBuilder([]).build();

      expect(doc.data).toEqual([]);
      expect(Array.isArray(doc.data)).toBe(true);
      expect(doc.data).toHaveLength(0);
    });

    it("should handle resources with relationships", () => {
      const resources: ResourceObject[] = [
        {
          type: "articles",
          id: "1",
          attributes: { title: "First" },
          relationships: {
            author: {
              data: { type: "people", id: "9" },
            },
            comments: {
              data: [
                { type: "comments", id: "5" },
                { type: "comments", id: "12" },
              ],
            },
          },
        },
      ];

      const doc = new JsonApiCollectionDocumentBuilder(resources).build();

      expect(doc.data).toEqual(resources);
    });

    it("should handle resources with links and meta", () => {
      const resources: ResourceObject[] = [
        {
          type: "articles",
          id: "1",
          attributes: { title: "First" },
          links: { self: "/articles/1" },
          meta: { views: 100 },
        },
        {
          type: "articles",
          id: "2",
          attributes: { title: "Second" },
          links: { self: "/articles/2" },
          meta: { views: 200 },
        },
      ];

      const doc = new JsonApiCollectionDocumentBuilder(resources).build();

      expect(doc.data).toEqual(resources);
    });
  });

  describe("included", () => {
    it("should set included resources", () => {
      const included: ResourceObject[] = [
        {
          type: "people",
          id: "9",
          attributes: { firstName: "Dan" },
        },
        {
          type: "comments",
          id: "5",
          attributes: { body: "Great article!" },
        },
      ];

      const doc = new JsonApiCollectionDocumentBuilder([])
        .included(included)
        .build();

      expect(doc.included).toEqual(included);
      expect(doc.included).toHaveLength(2);
    });

    it("should set empty included array", () => {
      const doc = new JsonApiCollectionDocumentBuilder([])
        .included([])
        .build();

      expect(doc.included).toEqual([]);
    });
  });

  describe("complete document", () => {
    it("should build a complete collection document with pagination", () => {
      const doc = new JsonApiCollectionDocumentBuilder([
        {
          type: "articles",
          id: "1",
          attributes: { title: "First Article" },
        },
          {
            type: "articles",
            id: "2",
            attributes: { title: "Second Article" },
          },
        ])
        .links({
          self: "/articles?page[offset]=0&page[limit]=10",
          first: "/articles?page[offset]=0&page[limit]=10",
          next: "/articles?page[offset]=10&page[limit]=10",
          last: "/articles?page[offset]=90&page[limit]=10",
        })
        .metadata({
          total: 100,
          page: {
            offset: 0,
            limit: 10,
          },
        })
        .build();

      expect(doc.data).toHaveLength(2);
      expect(doc.links).toHaveProperty("self");
      expect(doc.links).toHaveProperty("next");
      expect(doc.links).toHaveProperty("first");
      expect(doc.links).toHaveProperty("last");
      expect(doc.meta).toHaveProperty("total", 100);
    });

    it("should build a compound document with included resources", () => {
      const doc = new JsonApiCollectionDocumentBuilder([
        {
          type: "articles",
          id: "1",
          attributes: { title: "JSON:API" },
          relationships: {
            author: {
              data: { type: "people", id: "9" },
            },
          },
        },
      ])
        .included([
          {
            type: "people",
            id: "9",
            attributes: {
              firstName: "Dan",
              lastName: "Gebhardt",
            },
          },
        ])
        .build();

      expect(doc.data).toHaveLength(1);
      expect(doc.included).toHaveLength(1);
      expect(doc.included?.[0].type).toBe("people");
    });

    it("should build a minimal collection document", () => {
      const doc = new JsonApiCollectionDocumentBuilder([
        { type: "articles", id: "1", attributes: { title: "Test" } },
      ]).build();

      expect(doc.data).toHaveLength(1);
      expect(doc.included).toBeUndefined();
    });

    it("should build an empty collection document", () => {
      const doc = new JsonApiCollectionDocumentBuilder([])
        .links({ self: "/articles" })
        .metadata({ total: 0 })
        .build();

      expect(doc.data).toEqual([]);
      expect(doc.data).toHaveLength(0);
      expect(doc.meta?.total).toBe(0);
    });
  });

  describe("method chaining", () => {
    it("should support chaining all methods", () => {
      const result = new JsonApiCollectionDocumentBuilder([
        { type: "articles", id: "1", attributes: { title: "Test" } },
      ])
        .included([{ type: "people", id: "1", attributes: { name: "John" } }])
        .links({ self: "/articles" })
        .metadata({ total: 1 });

      expect(result).toBeInstanceOf(JsonApiCollectionDocumentBuilder);
    });
  });

  describe("real-world scenarios", () => {
    it("should build a paginated blog posts response", () => {
      const doc = new JsonApiCollectionDocumentBuilder([
        {
          type: "posts",
          id: "1",
          attributes: {
            title: "Getting Started with JSON:API",
            publishedAt: "2024-01-15T10:00:00Z",
            },
            relationships: {
              author: {
                data: { type: "users", id: "42" },
              },
            },
            links: { self: "/posts/1" },
          },
          {
            type: "posts",
            id: "2",
            attributes: {
              title: "Advanced JSON:API Techniques",
              publishedAt: "2024-01-20T14:30:00Z",
            },
            relationships: {
              author: {
                data: { type: "users", id: "42" },
              },
            },
            links: { self: "/posts/2" },
          },
        ])
        .included([
          {
            type: "users",
            id: "42",
            attributes: {
              name: "Jane Doe",
              email: "jane@example.com",
            },
            links: { self: "/users/42" },
          },
        ])
        .links({
          self: "/posts?page[offset]=0&page[limit]=2",
          next: "/posts?page[offset]=2&page[limit]=2",
          first: "/posts?page[offset]=0&page[limit]=2",
          last: "/posts?page[offset]=98&page[limit]=2",
        })
        .metadata({
          total: 100,
          page: { offset: 0, limit: 2 },
        })
        .build();

      expect(doc.data).toHaveLength(2);
      expect(doc.included).toHaveLength(1);
      expect(doc.links?.next).toBeDefined();
      expect(doc.meta?.total).toBe(100);
    });

    it("should build a filtered and sorted collection", () => {
      const doc = new JsonApiCollectionDocumentBuilder([
        {
          type: "products",
          id: "100",
          attributes: {
            name: "Premium Widget",
            price: 99.99,
            inStock: true,
          },
        },
        {
          type: "products",
          id: "101",
          attributes: {
            name: "Deluxe Widget",
            price: 149.99,
            inStock: true,
          },
        },
      ])
        .links({
          self: "/products?filter[inStock]=true&sort=-price",
        })
        .metadata({
          filter: { inStock: true },
          sort: "-price",
          total: 2,
        })
        .build();

      expect(doc.data).toHaveLength(2);
      expect(doc.meta?.filter).toEqual({ inStock: true });
      expect(doc.meta?.sort).toBe("-price");
    });
  });
});

describe("JsonApiErrorDocumentBuilder", () => {
  describe("errors", () => {
    it("should set errors array", () => {
      const errors: ErrorObject[] = [
        {
          status: "422",
          code: "VALIDATION_ERROR",
          title: "Validation Failed",
          detail: "Title must be at least 3 characters long",
          source: { pointer: "/data/attributes/title" },
        },
      ];

      const doc = new JsonApiErrorDocumentBuilder(errors[0]).errors(errors).build();

      expect(doc.errors).toEqual(errors);
      expect(doc.jsonapi).toEqual({ version: "1.0" });
    });

    it("should set multiple errors", () => {
      const errors: ErrorObject[] = [
        {
          status: "422",
          title: "Validation Failed",
          detail: "Title is required",
          source: { pointer: "/data/attributes/title" },
        },
        {
          status: "422",
          title: "Validation Failed",
          detail: "Email is invalid",
          source: { pointer: "/data/attributes/email" },
        },
      ];

      const doc = new JsonApiErrorDocumentBuilder(errors[0])
        .errors(errors)
        .build();

      expect(doc.errors).toHaveLength(2);
      expect(doc.errors[0].detail).toBe("Title is required");
      expect(doc.errors[1].detail).toBe("Email is invalid");
    });

    it("should replace existing errors", () => {
      const doc = new JsonApiErrorDocumentBuilder({ status: "400", title: "Bad Request" })
        .errors([{ status: "500", title: "Server Error" }])
        .build();

      expect(doc.errors).toHaveLength(1);
      expect(doc.errors[0].status).toBe("500");
    });
  });

  describe("error", () => {
    it("should add a single error", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        status: "404",
        title: "Not Found",
        detail: "Article with id '123' does not exist",
      }).build();

      expect(doc.errors).toHaveLength(1);
      expect(doc.errors[0].status).toBe("404");
    });

    it("should append errors when called multiple times", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        status: "400",
        title: "Bad Request",
        detail: "Invalid JSON",
      })
        .error({
          status: "400",
          title: "Bad Request",
          detail: "Missing header",
        })
        .build();

      expect(doc.errors).toHaveLength(2);
      expect(doc.errors[0].detail).toBe("Invalid JSON");
      expect(doc.errors[1].detail).toBe("Missing header");
    });

    it("should work with errors() method", () => {
      const doc = new JsonApiErrorDocumentBuilder({ status: "422", title: "Validation Error" })
        .errors([
          { status: "422", title: "Validation Error" },
          { status: "422", title: "Another Error" },
        ])
        .build();

      expect(doc.errors).toHaveLength(2);
    });
  });

  describe("with metadata and links", () => {
    it("should support metadata", () => {
      const doc = new JsonApiErrorDocumentBuilder({ status: "500", title: "Server Error" })
        .metadata({ requestId: "abc-123", timestamp: "2024-01-15T10:00:00Z" })
        .build();

      expect(doc.meta).toEqual({
        requestId: "abc-123",
        timestamp: "2024-01-15T10:00:00Z",
      });
    });

    it("should support links", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        status: "401",
        title: "Unauthorized",
        links: {
          about: "https://api.example.com/docs/errors/401",
        },
      })
        .links({ self: "/articles/1" })
        .build();

      expect(doc.links).toEqual({ self: "/articles/1" });
    });
  });

  describe("real-world examples", () => {
    it("should build validation error document", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        id: "err-001",
        status: "422",
        code: "VALIDATION_ERROR",
        title: "Invalid Attribute",
        detail: "Title must be between 3 and 100 characters",
        source: { pointer: "/data/attributes/title" },
      })
        .error({
          id: "err-002",
          status: "422",
          code: "VALIDATION_ERROR",
          title: "Invalid Attribute",
          detail: "Email format is invalid",
          source: { pointer: "/data/attributes/email" },
        })
        .metadata({ errorCount: 2 })
        .build();

      expect(doc.errors).toHaveLength(2);
      expect(doc.meta?.errorCount).toBe(2);
    });

    it("should build not found error document", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        status: "404",
        code: "RESOURCE_NOT_FOUND",
        title: "Resource Not Found",
        detail: "The requested article could not be found",
        links: {
          about: "https://api.example.com/docs/errors#not-found",
        },
      }).build();

      expect(doc.errors[0].status).toBe("404");
      expect(doc.errors[0].code).toBe("RESOURCE_NOT_FOUND");
    });

    it("should build authorization error document", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        status: "403",
        code: "FORBIDDEN",
        title: "Forbidden",
        detail: "You do not have permission to access this resource",
        meta: {
          requiredRole: "admin",
          currentRole: "user",
        },
      }).build();

      expect(doc.errors[0].status).toBe("403");
      expect(doc.errors[0].meta?.requiredRole).toBe("admin");
    });

    it("should build query parameter error document", () => {
      const doc = new JsonApiErrorDocumentBuilder({
        status: "400",
        code: "INVALID_QUERY_PARAMETER",
        title: "Invalid Query Parameter",
        detail: "The 'page[limit]' parameter must be a positive integer",
        source: { parameter: "page[limit]" },
      }).build();

      expect(doc.errors[0].source?.parameter).toBe("page[limit]");
    });
  });
});
