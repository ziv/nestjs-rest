import {z} from "zod";
import {metaObject} from "./meta-oject";
import {links} from "./links";
import {resourceData, resourceDataCollection, resourceNull} from "std-json-api/schemas/resource";

export const jsonApiObject = z.object({
    version: z.string().optional(),
    meta: metaObject.optional(),
})

export const baseDocument = z.object({
    jsonapi: jsonApiObject.optional(),
    links: links.optional(),
    meta: metaObject.optional(),
    included: z.any().optional(), // todo complete this schema
});

export const singleResourceDocument = baseDocument.extend({
    data: z.union([resourceData, resourceNull]),

})

export const collectionResourceDocument = baseDocument.extend({
    data: resourceDataCollection,
})