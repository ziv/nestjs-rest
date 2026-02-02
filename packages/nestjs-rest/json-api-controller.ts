import {debuglog} from "node:util";
import {
    BadRequestException,
    Body,
    Delete,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
} from "@nestjs/common";
import type {
    Attributes,
    JsonApiCollectionDocument,
    JsonApiQuery,
    JsonApiQueryFields,
    JsonApiSingleDocument,
    RelationshipsObject,
    ResourceObject,
} from "std-json-api";
import {
    JsonApiCollectionDocumentBuilder,
    JsonApiDocumentBase,
    JsonApiDocumentBuilder,
    JsonApiMetaDocumentBuilder,
} from "std-json-api";
import {JsonQuery} from "./json-query";
import type {JsonApiAdapter, ResourceDescriptor,} from "./json-api-data-adapter";

const log = debuglog("nestjs-rest");

/**
 * Internal JSON:API fields mapping type.
 */
export type Fields = Record<string, 1>;

export type SafeParse = { safeParse: <T>(data: unknown) => { success: boolean, data: T } };

/**
 * Helper to toFields attribute names into Fields object.
 * @param acc
 * @param attr
 */
function toFields(acc: Fields, attr: string): Fields {
    acc[attr] = 1;
    return acc;
}

/**
 * Configuration options for the JSON:API controller.
 * We use the options as class to allow injection via NestJS DI.
 */
export class JsonApiControllersOptions {
    constructor(
        /**
         * Base URL for constructing resource links.
         */
        readonly baseUrl: string,
        /**
         * Resources mapping resource IDs to their adapters and descriptors.
         * Resource ID corresponds to the `type` field in JSON:API.
         * Resource ID is also used in the URL path to identify the resource.
         *
         * @example
         *
         * ```json
         * {
         *   "articles": {
         *     adapter: ArticlesAdapter,
         *     descriptor: ArticlesResourceDescriptor,
         *   },
         *   "users": {
         *     adapter: UsersAdapter,
         *     descriptor: UsersResourceDescriptor,
         *   },
         * }
         * ```
         */
        readonly resources: Record<string, {
            /**
             * REST adapter that provides CRUD operations for specific resource.
             */
            adapter: JsonApiAdapter;

            /**
             * Resource descriptor defining the resource type, ID key, and base URL.
             * Used to transform model objects into JSON:API resource objects.
             */
            descriptor: ResourceDescriptor;

            /**
             * Zod like schema for validating create payloads.
             */
            createSchema: SafeParse;

            /**
             * Zod like schema for validating update payloads.
             */
            updateSchema: SafeParse;
        }>,
    ) {
    }
}

/**
 * JSON:API Controller providing standard CRUD operations.
 * Supports multiple resources in a single controller based on configuration.
 *
 * Error handling is basic; extending controller should provide an error handler.
 */
export class JsonApiController {
    constructor(readonly options: JsonApiControllersOptions) {
    }

    /**
     * Fetch multiple records of a specific resource.
     *
     * Supports:
     * - Filtering: `filter[field]=value`
     * - Sorting: `sort=-created,title`
     * - Pagination: `page[offset]=0&page[limit]=10`
     * - Sparse fieldsets: `fields[articles]=title,body`
     * - Including relationships: `include=author,comments`
     *
     * @param resourceId - The resource identifier
     * @param query - Parsed JSON:API query parameters
     * @returns Collection document with resource array and metadata
     *
     * @see https://jsonapi.org/format/#fetching-resources
     * @see https://jsonapi.org/format/#fetching-resources-responses
     */
    @Get(":resourceId")
    @Header("Content-Type", "application/vnd.api+json")
    async multiple(
        @Param("resourceId") resourceId: string,
        @JsonQuery() query: JsonApiQuery,
    ): Promise<JsonApiCollectionDocument> {
        log("Fetching multiple resource '%s' with query %O", resourceId, query);
        const res = this.resource(resourceId);

        // a. in multiple resource fetches, the adapter is in charge of applying sparse fieldsets (projection).
        // b. if no fields are specified, use listAttributes as default fields in list requests even if it's an
        //    empty list, we still set it to avoid fetching all fields.
        // c. empty attributes object is a valid use case for list views.
        if (!query.fields[resourceId]) {
            query.fields[resourceId] = res.descriptor.listAttributes.reduce(
                toFields,
                {} as Fields,
            );
        }

        // did you ask yourself why not just use a single call to fetch data + count?
        // well, in production we prefer to do things separately
        // 1. counting can be optimized differently (e.g., estimated count)
        // 2. some databases do not support combined data+count queries/pipelines efficiently
        // 3. separation of concerns
        // 4. easier to implement adapters
        // 5. counting can be cached independently
        // 6. and more...
        const [results, total] = await Promise.all([
            res.adapter.multiple(query),
            res.adapter.count(query),
        ]);

        // convert models to JSON:API resources
        const resources = results.map((model) =>
            this.transformModelToResource(res.descriptor, model)
        );

        return new JsonApiCollectionDocumentBuilder(resources)
            .metadata({
                total,
            })
            // todo enrich the links with pagination links based on the strategy used
            .link("self", `${this.options.baseUrl}/${resourceId}`)
            .build();
    }

    /**
     * Fetch a single record of a specific resource by ID.
     *
     * Returns a 404 Not Found error if the resource doesn't exist.
     *
     * @param resourceId - The resource identifier
     * @param id - The resource identifier
     * @param query - Parsed JSON:API query parameters
     * @returns Single resource document
     *
     * @see https://jsonapi.org/format/#fetching-resources
     * @see https://jsonapi.org/format/#fetching-resources-responses-200
     * @see https://jsonapi.org/format/#fetching-resources-responses-404
     */
    @Get(":resourceId/:id")
    @Header("Content-Type", "application/vnd.api+json")
    async single(
        @Param("resourceId") resourceId: string,
        @Param("id") id: string,
        @JsonQuery() query: JsonApiQuery,
    ): Promise<JsonApiSingleDocument> {
        log(
            `Fetching single resource (%s) with id: %s and query: %O`,
            resourceId,
            id,
            query,
        );
        const res = this.resource(resourceId);

        // if fields specified for this resource, use them, otherwise use descriptor attributes
        const fields = query.fields[resourceId]
            ? query.fields[resourceId]
            : Object.keys(res.descriptor.attributes).reduce(
                toFields,
                {} as Fields,
            ) as JsonApiQueryFields["item"];

        // we pass the fields to the adapter to allow it to optimize the fetch (e.g., projection)
        const model = await res.adapter.single(id, fields);
        if (!model) {
            log(
                `Resource (%s) with id: %s not found.`,
                resourceId,
                id,
            );
            throw new NotFoundException({
                errors: [
                    {
                        status: "404",
                        title: "Resource Not Found",
                        detail:
                            `The requested resource (${resourceId}) with id '${id}' was not found.`,
                    },
                ],
            });
        }

        const resource = this.transformModelToResource(res.descriptor, model, id);

        // handle relationships (without includes for now)
        const relationships: RelationshipsObject = {};

        for (const rel of res.descriptor.relationships) {
            relationships[rel.resourceId] = {
                links: {
                    self:
                        `${this.options.baseUrl}/${resourceId}/${id}/relationships/${rel.idKey}`,
                    related: `${this.options.baseUrl}/${resourceId}/${id}/${rel.idKey}`,
                },
            };
        }

        if (Object.keys(relationships).length > 0) {
            resource.relationships = relationships;
        }

        return new JsonApiDocumentBuilder(resource)
            .build();
    }

    /**
     * Create a new resource.
     *
     * Accepts a JSON:API document with resource data and returns the created
     * resource with a 201 Created status.
     *
     * @param resourceId - The resource identifier
     * @param body - JSON:API document with resource data
     * @returns Single resource document with creation metadata
     *
     * @see https://jsonapi.org/format/#crud-creating
     * @see https://jsonapi.org/format/#crud-creating-responses-201
     */
    @Post(":resourceId")
    @Header("Content-Type", "application/vnd.api+json")
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Param("resourceId") resourceId: string,
        // todo type should contain the type field as well and then validate it against resourceId
        @Body() body: { data: { attributes: Attributes } },
    ): Promise<JsonApiDocumentBase> {
        // validate request body
        if (!body?.data?.attributes) {
            throw new BadRequestException(
                `Invalid request body. Expected JSON:API document with 'data.attributes'.`,
            );
        }

        const res = this.resource(resourceId);

        // validate attributes against create schema
        const parsed = res.createSchema.safeParse(body.data.attributes);

        if (!parsed.success) {
            throw new BadRequestException(
                `Invalid request body. Payload does not conform to the required schema.`,
            );
        }

        log(
            `Creating new resource (%s) with data: %O`,
            resourceId,
            parsed.data,
        );

        const id = await res.adapter.create(parsed.data);

        return new JsonApiMetaDocumentBuilder()
            .metadata({
                created: true,
                id,
            })
            .link("related", `${this.options.baseUrl}/${resourceId}/${id}`)
            .build();
    }

    /**
     * Update an existing resource by ID.
     *
     * Accepts a JSON:API document with partial resource data and returns
     * the updated resource with a 200 OK status.
     *
     * @param resourceId - The resource identifier
     * @param id - The resource identifier
     * @param body - JSON:API document with partial resource data
     * @returns Single resource document with update metadata
     *
     * @see https://jsonapi.org/format/#crud-updating
     * @see https://jsonapi.org/format/#crud-updating-responses-200
     * @see https://jsonapi.org/format/#crud-updating-responses-404
     */
    @Patch(":resourceId/:id")
    @Header("Content-Type", "application/vnd.api+json")
    async update(
        @Param("resourceId") resourceId: string,
        @Param("id") id: string,
        @Body() body: { data: { attributes: Partial<Attributes> } },
    ): Promise<JsonApiDocumentBase> {
        log(
            `Updating resource (%s) with id: %s and data: %O`,
            resourceId,
            id,
            body.data.attributes,
        );
        const res = this.resource(resourceId);
        await res.adapter.update(
            id,
            body.data.attributes,
        );
        return new JsonApiMetaDocumentBuilder()
            .link("self", `${this.options.baseUrl}/${resourceId}/${id}`)
            .build();
    }

    /**
     * Delete a resource by ID.
     *
     * Returns a 204 No Content status on successful deletion.
     *
     * @param resourceId
     * @param id - The resource identifier
     *
     * @see https://jsonapi.org/format/#crud-deleting
     * @see https://jsonapi.org/format/#crud-deleting-responses-204
     * @see https://jsonapi.org/format/#crud-deleting-responses-404
     */
    @Delete(":resourceId/:id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param("resourceId") resourceId: string,
        @Param("id") id: string,
    ): Promise<JsonApiDocumentBase> {
        log(
            `Deleting resource (%s) with id: %s`,
            resourceId,
            id,
        );
        const res = this.resource(resourceId);
        await res.adapter.remove(id);
        return new JsonApiMetaDocumentBuilder().build();
    }

    /**
     * Get the resource configuration for the given resource ID.
     * @param resourceId
     * @protected
     */
    protected resource(
        resourceId: string,
    ): {
        adapter: JsonApiAdapter;
        descriptor: ResourceDescriptor;
        createSchema: SafeParse;
        updateSchema: SafeParse;
    } {
        const resource = this.options.resources[resourceId];
        if (!resource) {
            throw new NotFoundException(
                `Resource with ID '${resourceId}' is not configured. Did you forget to register it in the options?`,
            );
        }
        return resource;
    }

    /**
     * Transform a model object into a JSON:API resource object.
     *
     * This method extracts the ID from the model based on the configured
     * `idKey` and maps the model properties to resource attributes.
     *
     * @param desc
     * @param model - The model object from the adapter
     * @param explicitId - Optional explicit ID (used when ID is known from context)
     * @returns A JSON:API resource object
     *
     * @internal
     */
    protected transformModelToResource(
        desc: ResourceDescriptor,
        model: Attributes,
        explicitId?: string,
    ): ResourceObject {
        // extract ID from model based on idKey configuration
        let id: string;
        if (explicitId) {
            id = explicitId;
        } else if (Array.isArray(desc.idKey)) {
            // composite key: join multiple fields
            id = desc.idKey
                .map((key) => {
                    const value = model[key];
                    if (value === null || value === undefined) {
                        throw new Error(`Missing required key field '${key}' in model`);
                    }
                    return String(value);
                })
                .join("-");
        } else {
            // single key field
            id = String(model[desc.idKey]);
        }

        // extract attributes
        const attributes: Attributes = {...model};

        // build resource object
        return {
            type: desc.resourceId,
            id,
            attributes,
            links: {
                self: `${this.options.baseUrl}/${desc.resourceId}/${id}`,
            },
        };
    }
}
