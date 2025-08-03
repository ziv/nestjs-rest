// import {z} from "zod/index";
// import {metaObject} from "std-json-api/json-api-schema";
//
// /**
//  * Resource objects
//  * @see https://jsonapi.org/format/#document-resource-objects
//  */
// const resourceNull = z.null();
// const resourceIdentifier = z.object({
//     id: z.string(),
//     type: z.string(),
// });
// const resourceData = resourceIdentifier.extend({
//     attributes: attributesObject,
//     relationships: z.object({}),
//     links: links,
//     meta: metaObject,
// });
// const resourceDataCollection = z.array(
//     z.union([resourceData, resourceIdentifier]),
// );
//
// /**
//  * top level JSON:API object
//  * @see https://jsonapi.org/format/#document-structure
//  */
// const jsonApi = z.object({});
// const jsonApiMeta = z.object({});
// const jsonApiData = z.union([
//     resourceNull,
//     resourceData,
//     resourceDataCollection,
// ]);
// const jsonApiError = z.object({});
// const jsonApiLinks = z.union([
//     links,
//     z.object({
//         self: linkObject.optional(),
//         related: linkObject.optional(),
//         describedby: linkObject.optional(),
//     }),
// ]);
// const jsonApiIncluded = z.object({});
//
// const jsonApiDocument = z.object({
//     jsonapi: jsonApi.optional(),
//     meta: jsonApiMeta.optional(),
//     data: jsonApiData.optional(),
//     errors: jsonApiError.optional(),
//     links: jsonApiLinks.optional(),
//     included: jsonApiIncluded.optional(),
// }).superRefine((data, ctx) => {
//     /**
//      * @see https://jsonapi.org/format/#document-top-level
//      */
//     if (!data.meta && !data.data && !data.errors) {
//         ctx.addIssue(
//             "Document must contain at least one of 'meta', 'data', or 'errors'.",
//         );
//     }
// });