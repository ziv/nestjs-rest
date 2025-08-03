import {z} from "zod";
import {metaObject} from './meta-oject';

/**
 * Link Object
 * Links
 * @see https://jsonapi.org/format/#document-links
 * @see https://jsonapi.org/format/#document-links-link-object
 */

export const linkObject = z.object({
    href: z.url(),
    rel: z.string().optional(),
    title: z.string().optional(),
    type: z.string().optional(),
    hreflang: z.string().optional(),
    meta: metaObject,
    get describedby() {
        return linkObject.optional(); // recursive link object
    }
});

export const link = z.union([linkObject, z.url(), z.null()]);

export const links = z.record(z.string(), link);

export const selfLinks = z.object({
    self: link.optional(),
    related: link.optional(),
});

export const paginationLinks = z.object({
    first: link.optional(),
    last: link.optional(),
    prev: link.optional(),
    next: link.optional(),
});