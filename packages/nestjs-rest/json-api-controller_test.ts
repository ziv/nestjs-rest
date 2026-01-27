import { describe, it } from "node:test";
import expect from "expect";
import type {
  CreateResponse,
  JsonApiAdapter,
  MultipleResponse,
  RemoveResponse,
  SingleResponse,
  UpdateResponse,
} from "./adapter";
import type { Attributes, JsonApiQuery, Meta } from "std-json-api";
import {
  JsonApiCollectionDocumentBuilder,
  JsonApiDocumentBuilder,
} from "std-json-api";

/**
 * Sanity tests for JsonApiController integration.
 *
 * Since the controller uses decorators which tsx cannot compile in test mode,
 * we test:
 * 1. Mock adapter implementation
 * 2. Document builder integration
 * 3. Resource transformation logic
 *
 * These tests verify that all the pieces connect properly.
 */

/**
 * Mock adapter for testing the JsonApiController integration.
 */
class MockArticlesAdapter implements JsonApiAdapter<Attributes> {
  private mockData: Map<string, Attributes> = new Map([
    ["1", {
      _id: "1",
      title: "First Article",
      body: "Content 1",
      status: "published",
    }],
    ["2", {
      _id: "2",
      title: "Second Article",
      body: "Content 2",
      status: "draft",
    }],
    ["3", {
      _id: "3",
      title: "Third Article",
      body: "Content 3",
      status: "published",
    }],
  ]);

  async multiple(query: JsonApiQuery): Promise<MultipleResponse<Attributes>> {
    const allData = Array.from(this.mockData.values());

    // Apply filtering
    let filtered = allData;
    if (
      query.filter && typeof query.filter === "object" &&
      "status" in query.filter
    ) {
      filtered = allData.filter((item) => item.status === query.filter!.status);
    }

    // Apply pagination
    const offset = query.page && "offset" in query.page ? query.page.offset : 0;
    const limit = query.page && "limit" in query.page ? query.page.limit : 10;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      meta: {
        total: filtered.length,
        offset,
        limit,
      },
    };
  }

  async single(
    id: string,
    query: JsonApiQuery,
  ): Promise<SingleResponse<Attributes>> {
    const data = this.mockData.get(id);
    return {
      data: data || null,
      meta: data ? { found: true } : { found: false },
    };
  }

  async create<R = Attributes>(data: R): Promise<CreateResponse> {
    const id = String(this.mockData.size + 1);
    this.mockData.set(id, { ...data as any, _id: id });

    return {
      meta: {
        created: true,
        id,
      },
    };
  }

  async update<R = Attributes>(
    id: string,
    data: Partial<R>,
  ): Promise<UpdateResponse> {
    const existing = this.mockData.get(id);
    if (!existing) {
      throw new Error(`Resource ${id} not found`);
    }

    this.mockData.set(id, { ...existing, ...data });

    return {
      meta: {
        updated: true,
        id,
      },
    };
  }

  async remove(id: string): Promise<RemoveResponse> {
    const exists = this.mockData.has(id);
    if (!exists) {
      throw new Error(`Resource ${id} not found`);
    }

    this.mockData.delete(id);

    return {
      meta: {
        deleted: true,
        id,
      },
    };
  }
}

/**
 * Simulate the controller's transformModelToResource logic.
 */
function transformModelToResource(
  model: Attributes,
  resourceId: string,
  baseUrl: string,
  idKey: string,
  explicitId?: string,
): any {
  const id = explicitId || String(model[idKey]);
  const attributes = { ...model };
  delete attributes[idKey];

  return {
    type: resourceId,
    id,
    attributes,
    links: {
      self: `${baseUrl}/${id}`,
    },
  };
}

describe("JsonApiController Integration", () => {
  describe("MockArticlesAdapter", () => {
    it("should implement JsonApiAdapter interface", () => {
      const adapter = new MockArticlesAdapter();

      expect(adapter).toHaveProperty("multiple");
      expect(adapter).toHaveProperty("single");
      expect(adapter).toHaveProperty("create");
      expect(adapter).toHaveProperty("update");
      expect(adapter).toHaveProperty("remove");
    });

    it("should return data from multiple()", async () => {
      const adapter = new MockArticlesAdapter();
      const result = await adapter.multiple({});

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return data from single()", async () => {
      const adapter = new MockArticlesAdapter();
      const result = await adapter.single("1", {});

      expect(result).toHaveProperty("data");
      expect(result.data).toBeDefined();
    });

    it("should handle filtering", async () => {
      const adapter = new MockArticlesAdapter();
      const result = await adapter.multiple({
        filter: { status: "published" },
      });

      expect(result.data.every((item) => item.status === "published")).toBe(
        true,
      );
    });

    it("should handle pagination", async () => {
      const adapter = new MockArticlesAdapter();
      const result = await adapter.multiple({
        page: { offset: 1, limit: 1 },
      });

      expect(result.data.length).toBe(1);
    });
  });

  describe("transformModelToResource", () => {
    it("should transform model to resource object", () => {
      const model = {
        _id: "1",
        title: "Test Article",
        body: "Content",
      };

      const resource = transformModelToResource(
        model,
        "articles",
        "/api/articles",
        "_id",
      );

      expect(resource.type).toBe("articles");
      expect(resource.id).toBe("1");
      expect(resource.attributes).toHaveProperty("title", "Test Article");
      expect(resource.attributes).toHaveProperty("body", "Content");
      expect(resource.attributes).not.toHaveProperty("_id");
    });

    it("should use explicit ID when provided", () => {
      const model = { _id: "1", title: "Test" };

      const resource = transformModelToResource(
        model,
        "articles",
        "/api/articles",
        "_id",
        "explicit-123",
      );

      expect(resource.id).toBe("explicit-123");
    });

    it("should generate self link", () => {
      const model = { _id: "42", title: "Test" };

      const resource = transformModelToResource(
        model,
        "articles",
        "/api/articles",
        "_id",
      );

      expect(resource.links.self).toBe("/api/articles/42");
    });
  });

  describe("document builder integration", () => {
    it("should build collection document from adapter response", async () => {
      const adapter = new MockArticlesAdapter();
      const adapterResult = await adapter.multiple({});

      const resources = adapterResult.data.map((model) =>
        transformModelToResource(model, "articles", "/api/articles", "_id")
      );

      const document = new JsonApiCollectionDocumentBuilder()
        .data(resources)
        .metadata(adapterResult.meta!)
        .links({ self: "/api/articles" })
        .build();

      expect(document).toHaveProperty("data");
      expect(document).toHaveProperty("meta");
      expect(document).toHaveProperty("links");
      expect(Array.isArray(document.data)).toBe(true);
    });

    it("should build single document from adapter response", async () => {
      const adapter = new MockArticlesAdapter();
      const adapterResult = await adapter.single("1", {});

      if (adapterResult.data) {
        const resource = transformModelToResource(
          adapterResult.data,
          "articles",
          "/api/articles",
          "_id",
          "1",
        );

        const document = new JsonApiDocumentBuilder()
          .data(resource)
          .links({ self: "/api/articles/1" })
          .build();

        expect(document).toHaveProperty("data");
        expect(document).toHaveProperty("links");
        expect(document.data).not.toBeNull();
      }
    });

    it("should handle create response", async () => {
      const adapter = new MockArticlesAdapter();
      const createResponse = await adapter.create({
        title: "New Article",
        body: "New content",
      });

      expect(createResponse.meta).toHaveProperty("created", true);
      expect(createResponse.meta).toHaveProperty("id");
      expect(typeof createResponse.meta.id).toBe("string");
    });

    it("should handle update response", async () => {
      const adapter = new MockArticlesAdapter();
      const updateResponse = await adapter.update("1", {
        title: "Updated Title",
      });

      expect(updateResponse.meta).toHaveProperty("updated", true);
      expect(updateResponse.meta).toHaveProperty("id", "1");
    });

    it("should handle delete response", async () => {
      const adapter = new MockArticlesAdapter();
      const removeResponse = await adapter.remove("3");

      expect(removeResponse.meta).toHaveProperty("deleted", true);
      expect(removeResponse.meta).toHaveProperty("id", "3");
    });
  });

  describe("end-to-end workflow simulation", () => {
    it("should simulate full CRUD workflow", async () => {
      const adapter = new MockArticlesAdapter();
      const resourceId = "articles";
      const baseUrl = "/api/articles";
      const idKey = "_id";

      // 1. List resources (GET /)
      const listResult = await adapter.multiple({
        page: { offset: 0, limit: 10 },
      });
      expect(listResult.data.length).toBeGreaterThan(0);

      const listDoc = new JsonApiCollectionDocumentBuilder()
        .data(
          listResult.data.map((m) =>
            transformModelToResource(m, resourceId, baseUrl, idKey)
          ),
        )
        .metadata(listResult.meta!)
        .build();
      expect(listDoc.data).toBeDefined();

      // 2. Create resource (POST /)
      const createResult = await adapter.create({
        title: "New Article",
        body: "Content",
        status: "draft",
      });
      expect(createResult.meta.created).toBe(true);
      const newId = createResult.meta.id;

      // 3. Get single resource (GET /:id)
      const singleResult = await adapter.single(newId, {});
      expect(singleResult.data).toBeDefined();

      if (singleResult.data) {
        const singleDoc = new JsonApiDocumentBuilder()
          .data(
            transformModelToResource(
              singleResult.data,
              resourceId,
              baseUrl,
              idKey,
              newId,
            ),
          )
          .build();
        expect(singleDoc.data).toBeDefined();
      }

      // 4. Update resource (PATCH /:id)
      const updateResult = await adapter.update(newId, { status: "published" });
      expect(updateResult.meta.updated).toBe(true);

      // 5. Delete resource (DELETE /:id)
      const deleteResult = await adapter.remove(newId);
      expect(deleteResult.meta.deleted).toBe(true);

      // 6. Verify deletion
      const afterDelete = await adapter.single(newId, {});
      expect(afterDelete.data).toBeNull();
    });

    it("should handle filtered and paginated query", async () => {
      const adapter = new MockArticlesAdapter();

      const result = await adapter.multiple({
        filter: { status: "published" },
        page: { offset: 0, limit: 2 },
      });

      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.data.every((item) => item.status === "published")).toBe(
        true,
      );
      expect(result.meta).toHaveProperty("total");
    });

    it("should build proper JSON:API responses", async () => {
      const adapter = new MockArticlesAdapter();
      const resourceId = "articles";
      const baseUrl = "/api/articles";
      const idKey = "_id";

      // Collection response
      const collectionResult = await adapter.multiple({});
      const collectionDoc = new JsonApiCollectionDocumentBuilder()
        .data(
          collectionResult.data.map((m) =>
            transformModelToResource(m, resourceId, baseUrl, idKey)
          ),
        )
        .metadata(collectionResult.meta!)
        .links({
          self: baseUrl,
          first: `${baseUrl}?page[offset]=0&page[limit]=10`,
          next: `${baseUrl}?page[offset]=10&page[limit]=10`,
        })
        .build();

      expect(collectionDoc).toHaveProperty("data");
      expect(collectionDoc).toHaveProperty("meta");
      expect(collectionDoc).toHaveProperty("links");
      expect(collectionDoc).toHaveProperty("jsonapi");

      // Single resource response
      const singleResult = await adapter.single("1", {});
      if (singleResult.data) {
        const singleDoc = new JsonApiDocumentBuilder()
          .data(
            transformModelToResource(
              singleResult.data,
              resourceId,
              baseUrl,
              idKey,
              "1",
            ),
          )
          .links({ self: `${baseUrl}/1` })
          .build();

        expect(singleDoc).toHaveProperty("data");
        expect(singleDoc).toHaveProperty("links");
        expect(singleDoc).toHaveProperty("jsonapi");
      }
    });
  });
});
