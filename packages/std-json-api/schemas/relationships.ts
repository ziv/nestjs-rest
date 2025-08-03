import {z} from "zod";
import {links} from "./links";
import {metaObject} from "./meta-oject";

/**
 * Relationships
 * @see https://jsonapi.org/format/#document-resource-object-relationships
 * @see https://jsonapi.org/format/#document-resource-object-related-resource-links
 */
export const relationshipObject = z.object({
    links: links.optional(),
    data: z.any().optional(), // resource linkage or null
    meta: metaObject.optional(),
}).superRefine((data, ctx) => {
    if (!data.links && !data.data && !data.meta) {
        ctx.addIssue(
            "RelationshipObject must contain at least one of 'links', 'data', or 'meta'.",
        );
    }
    if (!data.links?.self || !data.links?.related || !data.links?.related) {
        ctx.addIssue(
            "RelationshipObject links must contain at least one of 'self', 'related' or 'article'.",
        );
    }
});
export const relationsObject = z.record(z.string(), relationshipObject);