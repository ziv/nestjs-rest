import {z} from "zod";

/**
 * Meta Object
 * @see https://jsonapi.org/format/#document-meta
 */
export const metaObject = z.record(z.string(), z.any()).superRefine(
    (data, ctx) => {
        if ("meta" in data) {
            const recursiveCheck = metaObject.safeParse(data["meta"]);
            if (!recursiveCheck.success) {
                ctx.addIssue(recursiveCheck.error.message);
            }
        }
    },
);