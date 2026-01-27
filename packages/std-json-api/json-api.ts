/**
 * JSON:API v1.1 TypeScript Type Definitions
 *
 * Complete type definitions for JSON:API documents as specified in version 1.1.
 * These types can be used to describe both request and response documents.
 *
 * @see https://jsonapi.org/format/
 */

// ============================================================================
// Meta Information
// ============================================================================

/**
 * A metaobject containing non-standard meta-information.
 *
 * Any members MAY be specified within metaobjects. Metaobjects can appear
 * at various levels: top-level document, resource objects, relationship objects,
 * link objects, error objects, and resource identifier objects.
 *
 * @example
 * ```json
 * {
 *   "meta": {
 *     "copyright": "Copyright 2015 Example Corp.",
 *     "authors": ["Yehuda Katz", "Steve Niklaas"]
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-meta
 */
export type Meta = {
  [key: string]: unknown;
};

// ============================================================================
// Links
// ============================================================================

/**
 * A link represented as either a string URI, a link object, or null.
 *
 * - String: A URI-reference pointing to the link's target
 * - LinkObject: An object with additional metadata about the link
 * - null: Indicates the link does not exist
 *
 * @see https://jsonapi.org/format/#document-links
 */
export type Link = string | LinkObject | null;

/**
 * A link object representing a web link with additional metadata.
 *
 * Link objects provide extra information about the link beyond just the URL,
 * such as media type hints, language information, and descriptive metadata.
 *
 * @example
 * ```json
 * {
 *   "href": "http://example.com/articles/1/comments",
 *   "title": "Comments",
 *   "type": "application/vnd.api+json",
 *   "meta": { "count": 10 }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-links-link-object
 */
export interface LinkObject {
  /**
   * A URI-reference pointing to the link's target.
   * REQUIRED.
   *
   * @see https://tools.ietf.org/html/rfc3986#section-4.1
   */
  href: string;

  /**
   * A string indicating the link's relation type.
   * The string MUST be a valid link relation type.
   *
   * @see https://tools.ietf.org/html/rfc8288#section-2.1
   */
  rel?: string;

  /**
   * A link to a description document (e.g., OpenAPI or JSON Schema)
   * for the link target.
   */
  describedby?: Link;

  /**
   * A human-readable label for the link destination.
   * Can be used as a menu entry or similar UI element.
   */
  title?: string;

  /**
   * The media type of the link's target.
   * Note: This is only a hint; the target resource is not guaranteed
   * to be available in the indicated media type.
   */
  type?: string;

  /**
   * The language(s) of the link's target.
   * Can be a single string or array of strings for multiple languages.
   * Each string MUST be a valid language tag.
   *
   * Note: This is only a hint; the target resource is not guaranteed
   * to be available in the indicated language.
   *
   * @see https://tools.ietf.org/html/rfc5646
   */
  hreflang?: string | string[];

  /**
   * Non-standard meta-information about the link.
   */
  meta?: Meta;
}

/**
 * A links object containing multiple named links.
 *
 * @see https://jsonapi.org/format/#document-links
 */
export type LinksObject = {
  [key: string]: Link;
};

/**
 * Pagination links that can appear in the top-level links object.
 *
 * These links allow clients to navigate through paginated collections.
 *
 * @see https://jsonapi.org/format/#fetching-pagination
 */
export interface PaginationLinks {
  /**
   * Link to the first page of results.
   */
  first?: Link;

  /**
   * Link to the last page of results.
   */
  last?: Link;

  /**
   * Link to the previous page of results.
   * Should be null or omitted on the first page.
   */
  prev?: Link;

  /**
   * Link to the next page of results.
   * Should be null or omitted on the last page.
   */
  next?: Link;
}

// ============================================================================
// JSON:API Object
// ============================================================================

/**
 * An object describing the server's JSON:API implementation.
 *
 * This object provides information about the JSON:API version,
 * extensions, and profiles supported by the implementation.
 *
 * @example
 * ```json
 * {
 *   "jsonapi": {
 *     "version": "1.1",
 *     "ext": ["https://jsonapi.org/ext/atomic"],
 *     "profile": ["http://example.com/profiles/flexible-pagination"]
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-jsonapi-object
 */
export interface JsonApiObject {
  /**
   * The highest JSON:API version supported.
   * Typically, "1.0" or "1.1".
   */
  version?: string;

  /**
   * An array of URIs for all applied extensions.
   *
   * Note: Clients and servers MUST NOT use this for content negotiation.
   * Content negotiation MUST only happen via media type parameters.
   *
   * @see https://jsonapi.org/format/#extensions
   */
  ext?: string[];

  /**
   * An array of URIs for all applied profiles.
   *
   * Note: Clients and servers MUST NOT use this for content negotiation.
   * Content negotiation MUST only happen via media type parameters.
   *
   * @see https://jsonapi.org/format/#profiles
   */
  profile?: string[];

  /**
   * Non-standard meta-information about the implementation.
   */
  meta?: Meta;
}

// ============================================================================
// Resource Identifier Objects
// ============================================================================

/**
 * A resource identifier object that uniquely identifies a resource.
 *
 * Resource identifier objects are used in resource linkage to reference
 * related resources without including their full data.
 *
 * @example
 * ```json
 * {
 *   "type": "people",
 *   "id": "9"
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-resource-identifier-objects
 */
export interface ResourceIdentifierObject {
  /**
   * The resource type.
   * REQUIRED.
   *
   * This describes resources that share common attributes and relationships.
   * Must be a string and should be consistent throughout the API.
   */
  type: string;

  /**
   * The resource's unique identifier within its type.
   *
   * Required except when representing a new resource to be created on the server.
   * When creating a resource, either `id` or `lid` must be present.
   */
  id?: string;

  /**
   * A locally unique identifier for the resource within the document.
   *
   * Used when the resource originates at the client and represents a new
   * resource to be created. The `lid` identifies the resource locally within
   * the document and must be the same for all representations of the resource.
   *
   * Note: Used only when `id` is not present for new resources.
   */
  lid?: string;

  /**
   * Non-standard meta-information about the resource identifier.
   */
  meta?: Meta;
}

// ============================================================================
// Resource Objects
// ============================================================================

/**
 * Attributes object containing the resource's data.
 *
 * Attributes represent information about the resource. They can contain
 * any valid JSON value, including complex structures with nested objects
 * and arrays.
 *
 * Note: Keys that reference related resources (e.g., "author_id") SHOULD NOT
 * appear as attributes. Use relationships instead.
 *
 * @see https://jsonapi.org/format/#document-resource-object-attributes
 */
export type Attributes = {
  [key: string]: unknown;
};

/**
 * A relationship object describing a relationship to another resource.
 *
 * A relationship object MUST contain at least one of: links, data, or meta.
 *
 * @example
 * ```json
 * {
 *   "author": {
 *     "links": {
 *       "self": "/articles/1/relationships/author",
 *       "related": "/articles/1/author"
 *     },
 *     "data": { "type": "people", "id": "9" }
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-resource-object-relationships
 */
export interface RelationshipObject {
  /**
   * Links related to the relationship.
   *
   * May contain:
   * - `self`: Link for the relationship itself (allows direct manipulation)
   * - `related`: Link to fetch the related resource(s)
   */
  links?: {
    /**
     * A link for the relationship itself.
     * Allows the client to directly manipulate the relationship.
     * When fetched, returns the linkage for the related resources as primary data.
     */
    self?: Link;

    /**
     * A related resource link.
     * When fetched, returns the related resource(s) as primary data.
     */
    related?: Link;

    [key: string]: Link | undefined;
  };

  /**
   * Resource linkage data.
   *
   * For to-one relationships:
   * - Single ResourceIdentifierObject for non-empty relationships
   * - null for empty relationships
   *
   * For to-many relationships:
   * - Array of ResourceIdentifierObjects for non-empty relationships
   * - Empty array [] for empty relationships
   *
   * @see https://jsonapi.org/format/#document-resource-object-linkage
   */
  data?: ResourceIdentifierObject | ResourceIdentifierObject[] | null;

  /**
   * Non-standard meta-information about the relationship.
   */
  meta?: Meta;
}

/**
 * A relationships object containing all relationships for a resource.
 *
 * Each member represents a relationship from the resource to other resources.
 * The relationship name is given by its key.
 *
 * @see https://jsonapi.org/format/#document-resource-object-relationships
 */
export type RelationshipsObject = {
  [relationshipName: string]: RelationshipObject;
};

/**
 * A resource object representing a single resource.
 *
 * Resource objects appear in JSON:API documents to represent resources.
 * They contain the resource's data (attributes), relationships to other
 * resources, links, and metadata.
 *
 * @example
 * ```json
 * {
 *   "type": "articles",
 *   "id": "1",
 *   "attributes": {
 *     "title": "Rails is Omakase",
 *     "body": { "type": "posts", "id": "5" }
 *   },
 *   "relationships": {
 *     "author": {
 *       "data": { "type": "people", "id": "9" }
 *     }
 *   },
 *   "links": {
 *     "self": "http://example.com/articles/1"
 *   }
 * }
 *
 * ```
 *
 * @see https://jsonapi.org/format/#document-resource-objects
 */
export interface ResourceObject<Model extends Attributes = Attributes> {
  /**
   * The resource type.
   * REQUIRED.
   *
   * Describes resources that share common attributes and relationships.
   */
  type: string;

  /**
   * The resource's unique identifier within its type.
   *
   * Required except when the resource originates at the client and represents
   * a new resource to be created. In that case, `lid` MAY be included instead.
   */
  id?: string;

  /**
   * A locally unique identifier for new resources being created.
   *
   * Used when the resource originates at the client. Must be identical
   * for every representation of the resource in the document.
   */
  lid?: string;

  /**
   * An object containing the resource's attributes.
   * Represents the resource's data.
   */
  attributes?: Model;

  /**
   * An object describing relationships to other JSON:API resources.
   */
  relationships?: RelationshipsObject;

  /**
   * Links related to the resource.
   *
   * May contain:
   * - `self`: Link that identifies this resource
   */
  links?: LinksObject;

  /**
   * Non-standard meta-information about the resource.
   * Contains information that cannot be represented as an attribute or relationship.
   */
  meta?: Meta;
}

// ============================================================================
// Error Objects
// ============================================================================

/**
 * Error source object indicating the source of an error.
 *
 * Contains references to the primary source of the error in the request.
 *
 * @see https://jsonapi.org/format/#error-objects
 */
export interface ErrorSource {
  /**
   * A JSON Pointer to the value in the request document that caused the error.
   *
   * Examples:
   * - "/data" for a primary data object
   * - "/data/attributes/title" for a specific attribute
   *
   * This MUST point to a value that exists in the request document.
   * If it doesn't exist, clients SHOULD ignore the pointer.
   *
   * @see https://tools.ietf.org/html/rfc6901
   */
  pointer?: string;

  /**
   * A string indicating which URI query parameter caused the error.
   *
   * Example: "page[limit]"
   */
  parameter?: string;

  /**
   * The name of a single request header which caused the error.
   *
   * Example: "Content-Type"
   */
  header?: string;
}

/**
 * An error object providing details about a problem.
 *
 * Error objects provide additional information about problems encountered
 * while performing an operation. They MUST be returned as an array in the
 * top-level `errors` member of a JSON:API document.
 *
 * An error object MUST contain at least one of its members.
 *
 * @example
 * ```json
 * {
 *   "errors": [{
 *     "status": "422",
 *     "code": "VALIDATION_ERROR",
 *     "title": "Validation Failed",
 *     "detail": "Title must be at least 3 characters long",
 *     "source": {
 *       "pointer": "/data/attributes/title"
 *     }
 *   }]
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#error-objects
 */
export interface ErrorObject {
  /**
   * A unique identifier for this particular occurrence of the problem.
   *
   * Useful for tracking specific error instances in logs.
   */
  id?: string;

  /**
   * Links related to the error.
   */
  links?: {
    /**
     * A link to further details about this particular error occurrence.
     * When dereferenced, SHOULD return a human-readable description.
     */
    about?: Link;

    /**
     * A link identifying the type of error.
     * Should be dereferenceable to a human-readable explanation of the general error.
     */
    type?: Link;

    [key: string]: Link | undefined;
  };

  /**
   * The HTTP status code applicable to this problem, expressed as a string.
   *
   * SHOULD be provided.
   *
   * Example: "400", "404", "422", "500"
   */
  status?: string;

  /**
   * An application-specific error code, expressed as a string.
   *
   * Example: "VALIDATION_ERROR", "RESOURCE_NOT_FOUND"
   */
  code?: string;

  /**
   * A short, human-readable summary of the problem.
   *
   * SHOULD NOT change from occurrence to occurrence except for localization.
   *
   * Example: "Validation Failed", "Resource Not Found"
   */
  title?: string;

  /**
   * A human-readable explanation specific to this occurrence of the problem.
   *
   * Like `title`, this field's value can be localized.
   *
   * Example: "The title field must be at least 3 characters long."
   */
  detail?: string;

  /**
   * An object containing references to the source of the error.
   */
  source?: ErrorSource;

  /**
   * Non-standard meta-information about the error.
   */
  meta?: Meta;
}

// ============================================================================
// Document Structure
// ============================================================================

/**
 * Top-level links that can appear in a JSON:API document.
 *
 * @see https://jsonapi.org/format/#document-top-level
 */
export interface DocumentLinks extends PaginationLinks {
  /**
   * The link that generated the current response document.
   *
   * If a document has extensions or profiles applied, this link SHOULD be
   * represented as a link object with the `type` attribute specifying the
   * JSON:API media type with all applicable parameters.
   *
   * The client should be able to use this link without additional information.
   * It must contain all query parameters used to generate the response
   * (include, fields, sort, page, filter, etc.).
   */
  self?: Link;

  /**
   * A related resource link when the primary data represents a resource relationship.
   */
  related?: Link;

  /**
   * A link to a description document (e.g., OpenAPI or JSON Schema)
   * for the current document.
   */
  describedby?: Link;

  /**
   * Additional custom links.
   */
  [key: string]: Link | undefined;
}

/**
 * Base JSON:API document structure.
 *
 * This is the foundation for all JSON:API documents. Every JSON:API document
 * must have a JSON object at the root level, and must contain at least one of:
 * data, errors, or meta.
 *
 * Note: The members `data` and `errors` MUST NOT coexist in the same document.
 *
 * @see https://jsonapi.org/format/#document-structure
 */
export interface JsonApiDocumentBase {
  /**
   * An object describing the server's JSON:API implementation.
   */
  jsonapi?: JsonApiObject;

  /**
   * Links related to the primary data.
   */
  links?: DocumentLinks;

  /**
   * Non-standard meta-information about the document.
   */
  meta?: Meta;
}

/**
 * A JSON:API document containing a single resource.
 *
 * This document type is used for:
 * - Responses to GET requests for individual resources
 * - Responses to POST requests after creating a resource
 * - Responses to PATCH requests after updating a resource
 *
 * The primary data is either:
 * - A single resource object
 * - A single resource identifier object
 * - null (for empty to-one relationships)
 *
 * @example
 * ```json
 * {
 *   "data": {
 *     "type": "articles",
 *     "id": "1",
 *     "attributes": {
 *       "title": "JSON:API paints my bikeshed!"
 *     }
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-top-level
 */
export interface JsonApiSingleDocument extends JsonApiDocumentBase {
  /**
   * The document's primary data.
   *
   * - ResourceObject: Full resource representation
   * - ResourceIdentifierObject: Reference to a resource
   * - null: Represents an empty to-one relationship or a resource that doesn't exist
   */
  data: ResourceObject | ResourceIdentifierObject | null;

  /**
   * An array of resource objects that are related to the primary data.
   *
   * These are "included resources" that were requested via the `include` query parameter.
   * All included resources MUST be referenced via a relationship chain from the primary data.
   *
   * Note: This member MUST NOT be present if the document does not have a `data` member.
   *
   * @see https://jsonapi.org/format/#document-compound-documents
   */
  included?: ResourceObject[];
}

/**
 * A JSON:API document containing a collection of resources.
 *
 * This document type is used for:
 * - Responses to GET requests for resource collections
 * - Responses that return multiple resources
 *
 * The primary data is an array of either:
 * - Resource objects (full representation)
 * - Resource identifier objects (references)
 * - Empty array [] (for empty collections or to-many relationships)
 *
 * @example
 * ```json
 * {
 *   "data": [
 *     {
 *       "type": "articles",
 *       "id": "1",
 *       "attributes": {
 *         "title": "First Article"
 *       }
 *     },
 *     {
 *       "type": "articles",
 *       "id": "2",
 *       "attributes": {
 *         "title": "Second Article"
 *       }
 *     }
 *   ],
 *   "links": {
 *     "self": "http://example.com/articles?page[offset]=0&page[limit]=10",
 *     "next": "http://example.com/articles?page[offset]=10&page[limit]=10"
 *   },
 *   "meta": {
 *     "total": 50
 *   }
 * }
 *
 * ```
 *
 * @see https://jsonapi.org/format/#document-top-level
 */
export interface JsonApiCollectionDocument extends JsonApiDocumentBase {
  /**
   * The document's primary data as a collection.
   *
   * Can contain:
   * - Array of ResourceObjects: Full resource representations
   * - Array of ResourceIdentifierObjects: References to resources
   * - Empty array: Represents an empty collection or to-many relationship
   */
  data: ResourceObject[] | ResourceIdentifierObject[];

  /**
   * An array of resource objects that are related to the primary data.
   *
   * These are "included resources" that were requested via the `include` query parameter.
   * All included resources MUST be referenced via a relationship chain from the primary data.
   *
   * Note: This member MUST NOT be present if the document does not have a `data` member.
   *
   * @see https://jsonapi.org/format/#document-compound-documents
   */
  included?: ResourceObject[];
}

/**
 * A JSON:API error document containing one or more errors.
 *
 * Error documents are returned when a request cannot be fulfilled.
 * They provide detailed information about what went wrong.
 *
 * Note: The `errors` and `data` members MUST NOT coexist in the same document.
 *
 * @example
 * ```json
 * {
 *   "errors": [
 *     {
 *       "status": "422",
 *       "title": "Validation Failed",
 *       "detail": "Title must be at least 3 characters long",
 *       "source": {
 *         "pointer": "/data/attributes/title"
 *       }
 *     },
 *     {
 *       "status": "422",
 *       "title": "Validation Failed",
 *       "detail": "Email has already been taken",
 *       "source": {
 *         "pointer": "/data/attributes/email"
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#errors
 * @see https://jsonapi.org/format/#error-objects
 */
export interface JsonApiErrorDocument extends JsonApiDocumentBase {
  /**
   * An array of error objects.
   *
   * REQUIRED. Must contain at least one error object.
   * Each error object provides details about a specific problem.
   */
  errors: ErrorObject[];
}

/**
 * A JSON:API document that contains only meta information.
 *
 * This document type is used when no primary data or errors need to be returned,
 * but meta-information should be provided.
 *
 * @example
 * ```json
 * {
 *   "meta": {
 *     "api-version": "1.0",
 *     "deprecation-notice": "This endpoint will be deprecated on 2024-01-01"
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#document-top-level
 */
export interface JsonApiMetaDocument extends JsonApiDocumentBase {
  /**
   * Non-standard meta-information.
   *
   * REQUIRED when data and errors are not present.
   */
  meta: Meta;
}

/**
 * Union type representing any valid JSON:API document.
 *
 * A JSON:API document MUST be one of:
 * - A document with a single resource
 * - A document with a collection of resources
 * - An error document
 * - A meta-only document
 *
 * @see https://jsonapi.org/format/#document-structure
 */
export type JsonApiDocument =
  | JsonApiSingleDocument
  | JsonApiCollectionDocument
  | JsonApiErrorDocument
  | JsonApiMetaDocument;

/// ===========================================================================
// Resource Descriptor
// ============================================================================

/**
 * An attribute or relationship type for a JSON:API resource.
 */
export type AttributeType =
  | "string"
  | "number"
  | "date"
  | "object"
  | "array"
  | "unknown"; //  typeof String | typeof Number | typeof Boolean | typeof Date | typeof Array | typeof Object | typeof Function | typeof Symbol | string;

/**
 * A mapping of attribute names to their types.
 */
export type DescriptorAttributes = Record<string, AttributeType>;

// export type Relationships = Record<string, { resource: string; idKey: string }>;

export type ResourceDescriptor = {
  /**
   * The unique identifier for the resource type.
   * E.g., 'articles', 'users', etc.
   */
  resourceId: string;

  /**
   * The base URL for the resource.
   * E.g., 'https://api.example.com/articles'
   */
  baseUrl: string;

  /**
   * The primary key for the resource.
   * E.g., 'id' or ['firstName', 'lastName'] for composite keys.
   */
  idKey: string | string[];

  /**
   * The attributes of the resource.
   * E.g., { title: 'string', content: 'string', publishedAt: 'date' }
   */
  attributes: DescriptorAttributes;
};
