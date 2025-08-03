import {z} from "zod";

/**
 * Attributes
 * @see https://jsonapi.org/format/#document-resource-object-attributes
 */
export const attributesObject = z.record(z.string(), z.any());