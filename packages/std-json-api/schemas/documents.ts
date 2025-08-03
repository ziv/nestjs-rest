import {z} from "zod";
import {AttributesObject, Links, Meta, PaginationLinks, ResourceObject} from "../../../tmp/json-api-types";
import {metaObject} from "./meta-oject";
import {links} from "./links";
import {resourceData, resourceDataCollection, resourceNull} from "std-json-api/schemas/resource";


export interface JsonApiObject {
    version?: "1.0";
    meta?: Meta;
}

export interface JsonApiDocumentBase {
    jsonapi?: JsonApiObject;
    links?: Links & PaginationLinks;
    meta?: Meta;
}

/**
 * A JSON:API document containing a single resource or null.
 * @template T The type of the resource's attributes.
 */
export interface SingleResourceDocument<
    T extends AttributesObject = AttributesObject,
> extends JsonApiDocumentBase {
    data: ResourceObject<T> | null;
    included?: ResourceObject[];
}

/**
 * A JSON:API document containing a collection of resources.
 * @template T The type of the resource's attributes.
 */
export interface CollectionResourceDocument<
    T extends AttributesObject = AttributesObject,
> extends JsonApiDocumentBase {
    data: ResourceObject<T>[];
    included?: ResourceObject[];
}

export const jsonApiObject = z.object({
    version: z.string().optional(),
    meta: metaObject.optional(),
})

export const baseDocument = z.object({
    jsonapi: jsonApiObject.optional(),
    links: links.optional(),
    meta: metaObject.optional(),
});

export const singleResourceDocument = baseDocument.extend({
    data: z.union([resourceData, resourceNull]),
    included: z.any(), // todo complete this schema
})

export const collectionResourceDocument = baseDocument.extend({
    data: resourceDataCollection,
    included: z.any(), // todo complete this schema
})