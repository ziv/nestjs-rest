import {BadRequestException, Body, Delete, Get, NotFoundException, Patch, Post,} from "@nestjs/common";
import {
    AttributesObject,
    CollectionResourceDocument,
    JsonApiDocument,
    Meta,
    SingleResourceDocument,
} from "std-json-api/json-api-types";
import {createDocument, updateDocument} from "std-json-api/json-api-schema";
import type {Response} from "express";
import {ZodType} from "zod";
import JsonApiAdapter, {type MultipleArgs} from "./adapter";
import Context, {JsonApiContext} from "./context";
import Search, {SearchDescriptor} from "./search";

// todo should add pagination strategy to the controller options?
// todo error handler, return ErrorDocument on error

export type RestControllerOptions = {
    /**
     * Array of REST adapters that provide CRUD operations for different resources.
     */
    adapter: JsonApiAdapter;

    resourceId: string;

    createSchema: ZodType;

    emptyResponse?: boolean;
};

export default class RestController<
    Model extends AttributesObject = AttributesObject,
> {
    constructor(readonly options: RestControllerOptions) {
    }

    /**
     * Fetch multiple records of a specific resource.
     * @see https://jsonapi.org/format/#fetching-resources
     * @see https://jsonapi.org/format/#fetching-resources-responses
     *
     * @param ctx
     * @param search
     */
    @Get("")
    async getMultipleRecords(
        @Context() ctx: JsonApiContext,
        @Search() search: SearchDescriptor,
    ): Promise<Response<CollectionResourceDocument>> {
        try {
            const doc = await this.options.adapter.multiple(search as MultipleArgs);
            return ctx.send(doc as CollectionResourceDocument);
        } catch (error) {
            // todo better error handling
            // @see https://jsonapi.org/format/#fetching-resources-responses-404
            throw new NotFoundException(
                `Resource ${this.options.resourceId} not found`,
            );
        }
        // const res = await adapter.multiple(search as MultipleArgs);
        // const total = res.meta.total as number;
        // // todo replace with pagination strategy
        // const linker = new JsonApiLinker({
        //     baseUrl: adapter.baseUrl(),
        //     resource: type,
        //     total,
        //     page,
        //     sort,
        //     filter,
        // } as LinkerOptions);
        //
        // return ctx.send(collectionDocument(
        //     links(linker.paginationAndSelf),
        //     meta({
        //         total,
        //         offset: page.offset,
        //         limit: page.limit,
        //     }),
        //     dataCollection(res.data.map((attrs) =>
        //         resource(
        //             identifier(adapter.id(attrs), adapter.resource()),
        //             attributes({}),
        //             links({
        //                 self: linker.self(adapter.id(attrs)),
        //             }),
        //         )
        //     )),
        // ));
    }

    /**
     * Fetch a single record of a specific resource by ID.
     * @see https://jsonapi.org/format/#fetching-resources
     * @see https://jsonapi.org/format/#fetching-resources-responses
     * @see https://jsonapi.org/format/#fetching-resources-responses-404
     *
     * @param ctx
     */
    @Get(":id")
    async getRecordById(
        @Context() ctx: JsonApiContext,
    ): Promise<Response<SingleResourceDocument>> {
        const doc = await this.options.adapter.single(ctx.recordId);
        if (!doc) {
            // @see https://jsonapi.org/format/#fetching-resources-responses-404
            throw new NotFoundException("Resource not found");
        }
        return ctx.send(doc);
        // const adapter = this.options.adapter;
        // const attrs = await adapter.single(ctx.recordId);
        //
        // // todo better error handling
        // if (!attrs) {
        //     // @see https://jsonapi.org/format/#fetching-resources-responses-404
        //     throw new NotFoundException("Resource not found");
        // }
        //
        // return ctx.send(resourceDocument(
        //     dataResource(resource(
        //         identifier(ctx.recordId, ctx.resourceId),
        //         attributes(attrs),
        //         links({
        //             // todo linker.self should be used here
        //             self: `${adapter.baseUrl()}/${ctx.resourceId}/${ctx.recordId}`,
        //         }),
        //     )),
        // ));
    }

    /**
     * Create a new record of a specific resource.
     * @see https://jsonapi.org/format/#crud-creating
     *
     * The response must be 201 and should contain a location header with the URL of the newly created resource.
     * @see https://jsonapi.org/format/#crud-creating-responses-201
     *
     * The endpoint return an identifier of the newly created resource without its attributes.
     * @see https://jsonapi.org/format/#crud-creating-client-ids
     *
     * @param ctx
     * @param body
     */
    @Post("")
    async createRecord(
        @Context() ctx: JsonApiContext,
        @Body() body: SingleResourceDocument<Model>,
    ): Promise<Response<JsonApiDocument>> {
        // schema validation
        const parsed = createDocument.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(
                "Invalid JSON:API document",
                parsed.error.message,
            );
        }

        // payload validation
        const doc = this.options.createSchema.safeParse(parsed.data);
        if (!doc.success) {
            throw new BadRequestException(
                "Invalid resource data",
                doc.error.message,
            );
        }

        // create the record
        const self = await this.options.adapter.create(doc.data);
        return this.describeOrEmpty(ctx.res, self, {inserted: true});
    }

    /**
     * Update a record of a specific resource by ID.
     * @ssee https://jsonapi.org/format/#crud-updating
     *
     * @param ctx
     * @param body
     */
    @Patch(":id")
    async updateRecord(
        @Context() ctx: JsonApiContext,
        @Body() body: SingleResourceDocument<Model>,
    ): Promise<Response<JsonApiDocument>> {
        const parsed = updateDocument.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(
                "Invalid JSON:API document",
                parsed.error.message,
            );
        }
        const doc = this.options.createSchema.safeParse(parsed.data);
        if (!doc.success) {
            throw new BadRequestException(
                "Invalid resource data",
                doc.error.message,
            );
        }
        // todo get rid of this any
        const self = await this.options.adapter.update(ctx.recordId, doc.data as any);
        return this.describeOrEmpty(ctx.res, self, {updated: true});
    }

    /**
     * Delete a record of a specific resource by ID.
     * @see https://jsonapi.org/format/#crud-deleting
     *
     * @param ctx
     */
    @Delete(":id")
    async deleteRecord(@Context() ctx: JsonApiContext) {
        const self = await this.options.adapter.remove(ctx.recordId);
        return this.describeOrEmpty(ctx.res, self, {deleted: true});
    }

    describeOrEmpty(res: Response, self: string, meta: Meta) {
        res.set("Content-Type", "application/vnd.api+json").set("Location", self);
        return this.options.emptyResponse
            ? res.status(204).send()
            : res.status(200).send({meta, links: {self}});
    }
}
