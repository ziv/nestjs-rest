import type {
  AttributesObject,
  CollectionResourceDocument,
  ErrorDocument,
  ErrorObject,
  ErrorSource,
  JsonApiDocument,
  Link,
  Links,
  Meta,
  PaginationLinks,
  RelationshipObject,
  RelationshipsObject,
  ResourceIdentifierObject,
  ResourceObject,
  SingleResourceDocument,
} from "./json-api-types";

/**
 * Builder class for creating JSON API documents with fluent interface
 */
export class JsonApiBuilder<T extends AttributesObject = AttributesObject> {
  private document: Partial<JsonApiDocument<T>> = {};

  /**
   * Set the JSON API version information
   */
  jsonApi(version?: "1.0", meta?: Meta): this {
    this.document.jsonapi = { version, meta };
    return this;
  }

  /**
   * Set meta information for the document
   */
  meta(meta: Meta): this {
    this.document.meta = meta;
    return this;
  }

  /**
   * Set links for the document
   */
  links(links: Links & PaginationLinks): this {
    this.document.links = links;
    return this;
  }

  /**
   * Set a single resource as data
   */
  data(resource: ResourceObject<T> | null): JsonApiBuilder<T> {
    (this.document as SingleResourceDocument<T>).data = resource;
    return this;
  }

  /**
   * Set a collection of resources as data
   */
  dataCollection(resources: ResourceObject<T>[]): JsonApiBuilder<T> {
    (this.document as CollectionResourceDocument<T>).data = resources;
    return this;
  }

  /**
   * Set included resources
   */
  included(resources: ResourceObject[]): this {
    if ("data" in this.document) {
      (this.document as
        | SingleResourceDocument<T>
        | CollectionResourceDocument<T>).included = resources;
    }
    return this;
  }

  /**
   * Set errors for error document
   */
  errors(errors: ErrorObject[]): JsonApiBuilder<T> {
    (this.document as ErrorDocument).errors = errors;
    return this;
  }

  /**
   * Build and return the JSON API document
   */
  build(): JsonApiDocument<T> {
    const doc = Object.assign({}, this.document);

    if ("errors" in this.document) {
      return doc as ErrorDocument;
    }

    if ("data" in this.document) {
      if (Array.isArray((this.document as any).datas)) {
        return doc as CollectionResourceDocument<T>;
      } else {
        return doc as SingleResourceDocument<T>;
      }
    }

    throw new Error("Document must have either data or errors");
  }

  /**
   * Serialize the document to JSON string
   */
  toJson(space?: string | number): string {
    return JSON.stringify(this.build(), null, space);
  }
}

/**
 * Builder class for creating Resource Objects
 */
export class ResourceBuilder<T extends AttributesObject = AttributesObject> {
  private resource: Partial<ResourceObject<T>> = {};

  constructor(id: string, type: string) {
    this.resource.id = id;
    this.resource.type = type;
  }

  /**
   * Set attributes for the resource
   */
  attributes(attributes: T): this {
    this.resource.attributes = attributes;
    return this;
  }

  /**
   * Set relationships for the resource
   */
  relationships(relationships: RelationshipsObject): this {
    this.resource.relationships = relationships;
    return this;
  }

  /**
   * Add a single relationship
   */
  relationship(name: string, relationship: RelationshipObject): this {
    if (!this.resource.relationships) {
      this.resource.relationships = {};
    }
    this.resource.relationships[name] = relationship;
    return this;
  }

  /**
   * Set links for the resource
   */
  links(links: Links): this {
    this.resource.links = links;
    return this;
  }

  /**
   * Set meta information for the resource
   */
  meta(meta: Meta): this {
    this.resource.meta = meta;
    return this;
  }

  /**
   * Build and return the resource object
   */
  build(): ResourceObject<T> {
    return Object.assign({}, this.resource) as ResourceObject<T>;
  }
}

/**
 * Builder class for creating Relationship Objects
 */
export class RelationshipBuilder {
  private relationship: RelationshipObject = {};

  /**
   * Set data for the relationship (single resource identifier)
   */
  data(data: ResourceIdentifierObject | null): this {
    this.relationship.data = data;
    return this;
  }

  /**
   * Set data for the relationship (array of resource identifiers)
   */
  dataCollection(data: ResourceIdentifierObject[]): this {
    this.relationship.data = data;
    return this;
  }

  /**
   * Set links for the relationship
   */
  links(links: Links): this {
    this.relationship.links = links;
    return this;
  }

  /**
   * Set meta information for the relationship
   */
  meta(meta: Meta): this {
    this.relationship.meta = meta;
    return this;
  }

  /**
   * Build and return the relationship object
   */
  build(): RelationshipObject {
    return this.relationship;
  }
}

/**
 * Builder class for creating Error Objects
 */
export class ErrorBuilder {
  private error: ErrorObject = {};

  /**
   * Set error ID
   */
  id(id: string): this {
    this.error.id = id;
    return this;
  }

  /**
   * Set error links
   */
  links(links: Links): this {
    this.error.links = links;
    return this;
  }

  /**
   * Set HTTP status code
   */
  status(status: string): this {
    this.error.status = status;
    return this;
  }

  /**
   * Set application-specific error code
   */
  code(code: string): this {
    this.error.code = code;
    return this;
  }

  /**
   * Set error title
   */
  title(title: string): this {
    this.error.title = title;
    return this;
  }

  /**
   * Set error detail
   */
  detail(detail: string): this {
    this.error.detail = detail;
    return this;
  }

  /**
   * Set error source
   */
  source(source: ErrorSource): this {
    this.error.source = source;
    return this;
  }

  /**
   * Set error meta information
   */
  meta(meta: Meta): this {
    this.error.meta = meta;
    return this;
  }

  /**
   * Build and return the error object
   */
  build(): ErrorObject {
    return this.error;
  }
}

/**
 * Main JSON API class with static factory methods and serialization
 */
export class JsonApi {
  /**
   * Create a new JSON API document builder
   */
  static document<
    T extends AttributesObject = AttributesObject,
  >(): JsonApiBuilder<T> {
    return new JsonApiBuilder<T>();
  }

  /**
   * Create a new resource builder
   */
  static resource<T extends AttributesObject = AttributesObject>(
    id: string,
    type: string,
  ): ResourceBuilder<T> {
    return new ResourceBuilder<T>(id, type);
  }

  /**
   * Create a new relationship builder
   */
  static relationship(): RelationshipBuilder {
    return new RelationshipBuilder();
  }

  /**
   * Create a new error builder
   */
  static error(): ErrorBuilder {
    return new ErrorBuilder();
  }

  /**
   * Create a resource identifier object
   */
  static resourceIdentifier(
    id: string,
    type: string,
    meta?: Meta,
  ): ResourceIdentifierObject {
    return { id, type, meta };
  }

  /**
   * Create a simple link
   */
  static link(href: string, meta?: Meta): Link {
    return meta ? { href, meta } : href;
  }

  /**
   * Serialize any JSON API object to JSON string
   */
  static serialize(obj: any, space?: string | number): string {
    return JSON.stringify(obj, null, space);
  }

  /**
   * Parse JSON string to JSON API document
   */
  static parse<T extends AttributesObject = AttributesObject>(
    json: string,
  ): JsonApiDocument<T> {
    return JSON.parse(json) as JsonApiDocument<T>;
  }

  /**
   * Validate if an object conforms to JSON API specification (basic validation)
   */
  static validate(obj: any): boolean {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    // Must have either data or errors, but not both
    const hasData = "data" in obj;
    const hasErrors = "errors" in obj;

    if (hasData && hasErrors) {
      return false;
    }

    if (!hasData && !hasErrors) {
      return false;
    }

    // If has data, validate data structure
    if (hasData) {
      const data = obj.data;
      if (
        data !== null && !this.isValidResourceObject(data) &&
        !Array.isArray(data)
      ) {
        return false;
      }
      if (
        Array.isArray(data) &&
        !data.every((item) => this.isValidResourceObject(item))
      ) {
        return false;
      }
    }

    // If has errors, validate errors structure
    if (hasErrors) {
      if (!Array.isArray(obj.errors) || obj.errors.length === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if an object is a valid resource object
   */
  private static isValidResourceObject(obj: any): boolean {
    return obj &&
      typeof obj === "object" &&
      typeof obj.id === "string" &&
      typeof obj.type === "string";
  }
}

// Export convenience functions
export const jsonApi = JsonApi.document;
export const resource = JsonApi.resource;
export const relationship = JsonApi.relationship;
export const error = JsonApi.error;
export const resourceIdentifier = JsonApi.resourceIdentifier;
export const link = JsonApi.link;
export const serialize = JsonApi.serialize;
export const parse = JsonApi.parse;
