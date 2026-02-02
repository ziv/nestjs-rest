import type {
  Attributes,
  JsonApiQuery,
  JsonApiQueryFields,
} from "std-json-api";

/// ===========================================================================
// Resource Descriptor
// ============================================================================

/**
 * An attribute type for a JSON:API resource.
 */
export type AttributeType =
  | "boolean"
  | "string"
  | "number"
  | "date"
  | "object"
  | "array"
  | "unknown";

/**
 * A mapping of attribute names to their types.
 */
export type DescriptorAttributes = Record<string, AttributeType>;

/**
 * An input ID can be a single string or an array of strings for composite keys.
 */

/**
 * Describes a relationship to another resource.
 */
export type Relationship = {
  resourceId: string;
  type: "to-one" | "to-many";
  idKey: string; // the current resource's key that maps to the related resource
  foreignKey: string; // the related resource's key that maps back to the current resource
};

export type ResourceDescriptor = {
  /**
   * The unique identifier for the resource type.
   * E.g., 'articles', 'users', etc.
   */
  resourceId: string;

  /**
   * todo do we need this?
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

  /**
   * The list of attributes to include when listing multiple resources.
   * E.g., ['title', 'publishedAt']
   */
  listAttributes: string[];

  /**
   * The relationships of the resource.
   * E.g., [{ resourceId: 'comments', type: 'to-many', idKey: 'id', foreignKey: 'articleId' }]
   */
  relationships: Relationship[];
};

/// ===========================================================================
// JsonApiAdapter Interface
// ============================================================================

/**
 * Interface defining CRUD operations for a JSON:API resource adapter.
 */
export interface JsonApiAdapter<Model extends Attributes = Attributes> {
  /**
   * Create a new resource document and return its ID.
   *
   * @param data
   */
  create<R = Model>(data: R): Promise<string>;

  /**
   * Count the total number of records matching the query.
   * Can be an estimate for performance.
   *
   * @param query
   */
  count(query: JsonApiQuery): Promise<number>;

  /**
   * Fetch multiple records of a specific resource.
   *
   * @param query
   */
  multiple(query: JsonApiQuery): Promise<Model[]>;

  /**
   * Fetch a single record of a specific resource by ID.
   *
   * @param id
   * @param fields
   */
  single(
    id: string,
    fields?: JsonApiQueryFields["item"],
  ): Promise<Model | null>;

  /**
   * Update a resource document by ID and return metadata.
   *
   * @param id
   * @param data
   */
  update<R = Model>(id: string, data: Partial<R>): Promise<boolean>;

  /**
   * Delete a resource document by ID and return metadata.
   *
   * @param id
   */
  remove(id: string): Promise<boolean>;
}
