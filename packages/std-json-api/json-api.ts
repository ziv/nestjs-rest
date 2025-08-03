import {z} from "zod";
import {metaObject} from "./schemas/meta-oject";
import {link, links, paginationLinks, selfLinks} from "./schemas/links";
import {attributesObject} from "./schemas/attributes";
import {relationshipObject, relationsObject} from "./schemas/relationships";
import {resourceData, resourceDataCollection, resourceIdentifier, resourceNull} from "std-json-api/schemas/resource";
import {baseDocument, collectionResourceDocument, singleResourceDocument} from "std-json-api/schemas/documents";

export type MetaObject = z.infer<typeof metaObject>;

export type Link = z.infer<typeof link>;
export type LinksObject = z.infer<typeof links>;
export type SelfLinkObject = z.infer<typeof selfLinks>;
export type PaginationLinksObject = z.infer<typeof paginationLinks>;

export type AttributesObject = z.infer<typeof attributesObject>;

export type RelationshipObject = z.infer<typeof relationshipObject>;
export type RelationshipsObject = z.infer<typeof relationsObject>;

export type ResourceNull = z.infer<typeof resourceNull>;
export type ResourceIdentifier = z.infer<typeof resourceIdentifier>;
export type SingleResource = z.infer<typeof resourceData>;
export type CollectionResource = z.infer<typeof resourceDataCollection>;

export type BaseDocument = z.infer<typeof baseDocument>;
export type SingleResourceDocument = z.infer<typeof singleResourceDocument>;
export type CollectionResourceDocument = z.infer<typeof collectionResourceDocument>;

export interface ErrorSource {
    pointer?: string;
    parameter?: string;
    header?: string;
}

export interface ErrorObject {
    id?: string;
    links?: LinksObject;
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    source?: ErrorSource;
    meta?: MetaObject;
}

export interface ErrorDocument extends BaseDocument {
    errors: ErrorObject[];
}

export interface PlainDocument extends BaseDocument {
}

/**
 * A generic JSON:API document.
 * @template T The type of the resource's attributes.
 */
export type JsonApiDocument =
    | SingleResourceDocument
    | CollectionResourceDocument
    | ErrorDocument
    | PlainDocument;
