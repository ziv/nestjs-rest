/**
 * Represents non-standard meta-information.
 */
export type Meta = Record<string, any>;

/**
 * A Link object can be a string URL or an object with `href` and optional `meta`.
 */
export type Link = string | { href: string; meta?: Meta };

/**
 * An object containing links, where each key is a link name.
 */
export interface Links {
    self?: Link;
    related?: Link;

    [key: string]: Link | undefined;
}

/**
 * An object describing the server's implementation.
 */
export interface JsonApiObject {
    version?: "1.0";
    meta?: Meta;
}

/**
 * Identifies a single resource.
 */
export interface ResourceIdentifierObject {
    id: string;
    type: string;
    meta?: Meta;
}

/**
 * Represents a relationship between resources.
 */
export interface RelationshipObject {
    links?: Links;
    data?: ResourceIdentifierObject | ResourceIdentifierObject[] | null;
    meta?: Meta;
}

/**
 * An object containing a resource's relationships.
 */
export type RelationshipsObject = Record<string, RelationshipObject>;

/**
 * An object containing a resource's attributes.
 */
export type AttributesObject = Record<string, any>;

/**
 * A resource object.
 * @template T The type of the attributes object.
 */
export interface ResourceObject<T extends AttributesObject = AttributesObject> {
    id: string;
    type: string;
    attributes?: T;
    relationships?: RelationshipsObject;
    links?: Links;
    meta?: Meta;
}

/**
 * An object containing references to the source of an error.
 */
export interface ErrorSource {
    pointer?: string;
    parameter?: string;
    header?: string;
}

/**
 * An error object.
 */
export interface ErrorObject {
    id?: string;
    links?: Links;
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    source?: ErrorSource;
    meta?: Meta;
}

/**
 * Pagination links.
 */
export interface PaginationLinks {
    first?: Link;
    last?: Link;
    prev?: Link;
    next?: Link;
}

/**
 * Base for a JSON:API document.
 */
interface JsonApiDocumentBase {
    jsonapi?: JsonApiObject;
    links?: Links & PaginationLinks;
    meta?: Meta;
}

/**
 * A JSON:API document containing a single resource or null.
 * @template T The type of the resource's attributes.
 */
export interface SingleResourceDocument<T extends AttributesObject = AttributesObject>
    extends JsonApiDocumentBase {
    data: ResourceObject<T> | null;
    included?: ResourceObject[];
}

/**
 * A JSON:API document containing a collection of resources.
 * @template T The type of the resource's attributes.
 */
export interface CollectionResourceDocument<T extends AttributesObject = AttributesObject>
    extends JsonApiDocumentBase {
    data: ResourceObject<T>[];
    included?: ResourceObject[];
}

export type DataResourceDocument = SingleResourceDocument & CollectionResourceDocument;

/**
 * A JSON:API document containing errors.
 */
export interface ErrorDocument extends JsonApiDocumentBase {
    errors: ErrorObject[];
}

/**
 * A generic JSON:API document.
 * @template T The type of the resource's attributes.
 */
export type JsonApiDocument<T extends AttributesObject = AttributesObject> =
    | SingleResourceDocument<T>
    | CollectionResourceDocument<T>
    | ErrorDocument;