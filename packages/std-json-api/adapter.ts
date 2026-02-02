import type {Attributes} from "./json-api";
import type {JsonApiQuery} from "./parser";


/// ===========================================================================
// Resource Descriptor
// ============================================================================

/**
 * An attribute or relationship type for a JSON:API resource.
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
 * A mapping of relationship names to their resource and ID key(s).
 */
export type Relationships = Record<string, { resource: string; idKey: string | string[] }>;

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

    /**
     * The relationships of the resource.
     * E.g., { author: { resource: 'users', idKey: 'userId' } }
     */
    relationships: Relationships;
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
     * Fetch multiple records of a specific resource.
     *
     * @param query
     */
    multiple(query: JsonApiQuery): Promise<Model[]>;

    /**
     * Fetch a single record of a specific resource by ID.
     *
     * @param id
     * @param query
     */
    single(id: string, query: JsonApiQuery): Promise<Model>;

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
