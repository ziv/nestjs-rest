import {
  JsonApiCollectionDocument,
  JsonApiDocumentBase,
  JsonApiSingleDocument,
  ResourceObject,
} from "./json-api";

/**
 * Base builder for JSON:API documents.
 *
 * Provides common functionality for building JSON:API documents including
 * setting jsonapi object, meta information, and links. This builder is extended
 * by specific document type builders.
 *
 * @template T - The specific JSON:API document type extending JsonApiDocumentBase
 *
 * @example
 * ```ts
 * // Used through concrete builders
 * const doc = new JsonApiDocumentBuilder()
 *   .metadata({ total: 100 })
 *   .links({ self: "/articles" })
 *   .build();
 * ```
 *
 * @see https://jsonapi.org/format/#document-structure
 */
export class JsonApiBaseBuilder<T extends JsonApiDocumentBase> {
  /**
   * The document being built.
   * Initialized with JSON:API version 1.0 by default.
   */
  protected readonly doc: T = {
    jsonapi: {
      version: "1.0",
    },
  } as T;

  /**
   * Builds and returns the completed JSON:API document.
   *
   * @returns The fully constructed JSON:API document
   *
   * @example
   * ```ts
   * const document = builder.build();
   * ```
   */
  build(): T {
    return this.doc as T;
  }

  /**
   * Sets meta-information on the document.
   *
   * Metaobjects contain non-standard meta-information about the document.
   * This can include pagination totals, copyright information, or any other
   * custom metadata.
   *
   * @param meta - The metaobject to set
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.metadata({
   *   total: 100,
   *   page: 1,
   *   copyright: "2024 Example Corp"
   * });
   * ```
   *
   * @see https://jsonapi.org/format/#document-meta
   */
  metadata(meta: JsonApiDocumentBase["meta"]): this {
    this.doc.meta = meta;
    return this;
  }

  /**
   * Sets links on the document.
   *
   * Links can include pagination links (first, last, prev, next), self links,
   * and any other custom links. Links can be strings (URIs) or link objects
   * with additional metadata.
   *
   * @param links - The links object to set
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.links({
   *   self: "/articles?page[offset]=0&page[limit]=10",
   *   next: "/articles?page[offset]=10&page[limit]=10",
   *   first: "/articles?page[offset]=0&page[limit]=10",
   *   last: "/articles?page[offset]=90&page[limit]=10"
   * });
   * ```
   *
   * @see https://jsonapi.org/format/#document-links
   * @see https://jsonapi.org/format/#fetching-pagination
   */
  links(links: JsonApiDocumentBase["links"]): this {
    this.doc.links = links;
    return this;
  }
}

/**
 * Builder for JSON:API resource objects.
 *
 * Provides a fluent interface for constructing resource objects with
 * type, id, attributes, relationships, links, and meta information.
 * Resource objects are the fundamental building blocks of JSON:API documents.
 *
 * @example
 * ```ts
 * const resource = new JsonApiResourceBuilder("articles", "1")
 *   .attributes({ title: "Hello World", body: "Content here" })
 *   .relationships({
 *     author: {
 *       data: { type: "people", id: "9" }
 *     }
 *   })
 *   .links({ self: "/articles/1" })
 *   .meta({ views: 1024 })
 *   .build();
 * ```
 *
 * @see https://jsonapi.org/format/#document-resource-objects
 */
export class JsonApiResourceBuilder {
  /**
   * The resource object being built.
   */
  private readonly resource: ResourceObject;

  /**
   * Creates a new resource builder.
   *
   * @param type - The resource type (required)
   * @param id - The resource ID (optional, omit for new resources being created)
   *
   * @example
   * ```ts
   * // Existing resource with ID
   * const builder = new JsonApiResourceBuilder("articles", "1");
   *
   * // New resource without ID (client-side creation)
   * const builder = new JsonApiResourceBuilder("articles");
   * ```
   */
  constructor(type: string, id?: string) {
    this.resource = { type, id };
  }

  /**
   * Sets a local identifier for new resources being created.
   *
   * The `lid` is used when a resource originates at the client and represents
   * a new resource to be created on the server. It provides a way to uniquely
   * identify the resource within the document.
   *
   * @param lid - The local identifier string
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.lid("temp-article-1");
   * ```
   *
   * @see https://jsonapi.org/format/#document-resource-object-identification
   */
  lid(lid: ResourceObject["lid"]): this {
    this.resource.lid = lid;
    return this;
  }

  /**
   * Sets the resource's attributes.
   *
   * Attributes contain the resource's data. They can include any valid JSON value,
   * including complex structures with nested objects and arrays.
   *
   * Note: Keys that reference related resources (e.g., "author_id") SHOULD NOT
   * appear as attributes. Use relationships instead.
   *
   * @param attributes - Object containing the resource's attributes
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.attributes({
   *   title: "JSON:API paints my bikeshed!",
   *   body: "The shortest article. Ever.",
   *   publishedAt: "2024-01-15T10:00:00Z"
   * });
   * ```
   *
   * @see https://jsonapi.org/format/#document-resource-object-attributes
   */
  attributes(attributes: ResourceObject["attributes"]): this {
    this.resource.attributes = attributes;
    return this;
  }

  /**
   * Sets the resource's relationships to other resources.
   *
   * Relationships describe connections between this resource and other
   * JSON:API resources. Each relationship can include links and/or
   * resource linkage data.
   *
   * @param relationships - Object containing the resource's relationships
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.relationships({
   *   author: {
   *     data: { type: "people", id: "9" },
   *     links: {
   *       self: "/articles/1/relationships/author",
   *       related: "/articles/1/author"
   *     }
   *   },
   *   comments: {
   *     data: [
   *       { type: "comments", id: "5" },
   *       { type: "comments", id: "12" }
   *     ]
   *   }
   * });
   * ```
   *
   * @see https://jsonapi.org/format/#document-resource-object-relationships
   */
  relationships(relationships: ResourceObject["relationships"]): this {
    this.resource.relationships = relationships;
    return this;
  }

  /**
   * Sets links related to the resource.
   *
   * Links can include a `self` link that identifies the resource,
   * as well as any custom links specific to the resource.
   *
   * @param links - Object containing the resource's links
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.links({
   *   self: "http://example.com/articles/1"
   * });
   * ```
   *
   * @see https://jsonapi.org/format/#document-resource-object-links
   */
  links(links: ResourceObject["links"]): this {
    this.resource.links = links;
    return this;
  }

  /**
   * Sets non-standard meta-information about the resource.
   *
   * Meta information can contain any data that doesn't fit in attributes
   * or relationships, such as computed values, timestamps, or other metadata.
   *
   * @param meta - Object containing meta-information
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.meta({
   *   created: "2024-01-15T10:00:00Z",
   *   updated: "2024-01-20T14:30:00Z",
   *   views: 1024
   * });
   * ```
   *
   * @see https://jsonapi.org/format/#document-meta
   */
  meta(meta: ResourceObject["meta"]): this {
    this.resource.meta = meta;
    return this;
  }

  /**
   * Builds and returns the completed resource object.
   *
   * @returns The fully constructed resource object
   *
   * @example
   * ```ts
   * const resource = builder.build();
   * ```
   */
  build(): ResourceObject {
    return this.resource;
  }
}

/**
 * Builder for JSON:API documents containing only meta information.
 */
export class JsonApiMetaDocumentBuilder
  extends JsonApiBaseBuilder<JsonApiDocumentBase> {
}

/**
 * Builder for JSON:API documents containing a single resource.
 *
 * Used to construct documents that contain a single resource object,
 * resource identifier object, or null. This is typically used for:
 * - GET requests for individual resources
 * - POST responses after creating a resource
 * - PATCH responses after updating a resource
 *
 * @example
 * ```ts
 * const document = new JsonApiDocumentBuilder()
 *   .data({
 *     type: "articles",
 *     id: "1",
 *     attributes: {
 *       title: "JSON:API paints my bikeshed!"
 *     }
 *   })
 *   .links({ self: "/articles/1" })
 *   .metadata({ views: 1024 })
 *   .build();
 * ```
 *
 * @see https://jsonapi.org/format/#document-top-level
 */
export class JsonApiDocumentBuilder
  extends JsonApiBaseBuilder<JsonApiSingleDocument> {
  /**
   * Sets the primary data for the document.
   *
   * The primary data can be:
   * - A resource object with full attributes and relationships
   * - A resource identifier object (type and id only)
   * - null (for empty to-one relationships or missing resources)
   *
   * @param data - The primary data to set
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * // Full resource object
   * builder.data({
   *   type: "articles",
   *   id: "1",
   *   attributes: { title: "Hello World" }
   * });
   *
   * // Resource identifier
   * builder.data({ type: "articles", id: "1" });
   *
   * // Null (resource not found)
   * builder.data(null);
   * ```
   */
  data(data: JsonApiSingleDocument["data"]): this {
    this.doc.data = data;
    return this;
  }

  /**
   * Sets included resources for compound documents.
   *
   * Included resources are related resources that were requested via the
   * `include` query parameter. All included resources MUST be referenced
   * via a relationship chain from the primary data.
   *
   * @param included - Array of resource objects to include
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.included([
   *   {
   *     type: "people",
   *     id: "9",
   *     attributes: {
   *       firstName: "Dan",
   *       lastName: "Gebhardt"
   *     }
   *   },
   *   {
   *     type: "comments",
   *     id: "5",
   *     attributes: { body: "First!" }
   *   }
   * ]);
   * ```
   *
   * @see https://jsonapi.org/format/#document-compound-documents
   */
  included(included: JsonApiSingleDocument["included"]): this {
    this.doc.included = included;
    return this;
  }
}

/**
 * Builder for JSON:API documents containing a collection of resources.
 *
 * Used to construct documents that contain an array of resources.
 * This is typically used for:
 * - GET requests for resource collections
 * - Responses that return multiple resources
 * - Empty collections (empty array)
 *
 * @example
 * ```ts
 * const document = new JsonApiCollectionDocumentBuilder()
 *   .data([
 *     {
 *       type: "articles",
 *       id: "1",
 *       attributes: { title: "First Article" }
 *     },
 *     {
 *       type: "articles",
 *       id: "2",
 *       attributes: { title: "Second Article" }
 *     }
 *   ])
 *   .links({
 *     self: "/articles?page[offset]=0&page[limit]=10",
 *     next: "/articles?page[offset]=10&page[limit]=10"
 *   })
 *   .metadata({ total: 50 })
 *   .build();
 * ```
 *
 * @see https://jsonapi.org/format/#document-top-level
 */
export class JsonApiCollectionDocumentBuilder
  extends JsonApiBaseBuilder<JsonApiCollectionDocument> {
  /**
   * Sets the primary data collection for the document.
   *
   * The primary data can be:
   * - An array of resource objects with full attributes and relationships
   * - An array of resource identifier objects (type and id only)
   * - An empty array (for empty collections)
   *
   * @param data - The array of resources to set
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * // Array of resource objects
   * builder.data([
   *   { type: "articles", id: "1", attributes: { title: "First" } },
   *   { type: "articles", id: "2", attributes: { title: "Second" } }
   * ]);
   *
   * // Array of resource identifiers
   * builder.data([
   *   { type: "articles", id: "1" },
   *   { type: "articles", id: "2" }
   * ]);
   *
   * // Empty collection
   * builder.data([]);
   * ```
   */
  data(data: JsonApiCollectionDocument["data"]): this {
    this.doc.data = data;
    return this;
  }

  /**
   * Sets included resources for compound documents.
   *
   * Included resources are related resources that were requested via the
   * `include` query parameter. All included resources MUST be referenced
   * via a relationship chain from the primary data.
   *
   * @param included - Array of resource objects to include
   * @returns The builder instance for method chaining
   *
   * @example
   * ```ts
   * builder.included([
   *   {
   *     type: "people",
   *     id: "9",
   *     attributes: {
   *       firstName: "Dan",
   *       lastName: "Gebhardt"
   *     }
   *   }
   * ]);
   * ```
   *
   * @see https://jsonapi.org/format/#document-compound-documents
   */
  included(included: JsonApiCollectionDocument["included"]): this {
    this.doc.included = included;
    return this;
  }
}
