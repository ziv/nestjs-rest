import {z} from "zod";
import {attributesObject} from "./attributes";
import {links} from "./links";
import {metaObject} from "./meta-oject";

/**
 * Resource objects
 * @see https://jsonapi.org/format/#document-resource-objects
 */
export const resourceNull = z.null();

export const resourceIdentifier = z.object({
    id: z.string(),
    type: z.string(),
});

export const resourceData = resourceIdentifier.extend({
    attributes: attributesObject.optional(),
    relationships: z.object({}).optional(), // todo complete this schema
    links: links.optional(),
    meta: metaObject.optional(),
});

export const resourceDataCollection = z.array(
    z.union([resourceData, resourceIdentifier]),
);