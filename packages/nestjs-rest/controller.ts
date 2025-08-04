import {Body, Delete, Get, Header, Param, Patch, Post,} from "@nestjs/common";
import {ZodType} from "zod";
import JsonApiAdapter from "./adapter";
import Search from "./decorators/search";
import {CollectionResourceDocument, PlainDocument, SingleResourceDocument} from "std-json-api/json-api";
import {JsonApiQuery} from "std-json-api/query-string-parser";

export type JsonApiControllerOptions = {
    /**
     * Array of REST adapters that provide CRUD operations for different resources.
     */
    adapter: JsonApiAdapter;
    resourceId: string;
    baseUrl: string;
    createSchema: ZodType;
    updateSchema: ZodType;
};

export default class JsonApiController {
    constructor(readonly options: JsonApiControllerOptions) {
    }

    /**
     * Fetch multiple records of a specific resource.
     * @see https://jsonapi.org/format/#fetching-resources
     * @see https://jsonapi.org/format/#fetching-resources-responses
     *
     * @param search
     */
    @Get("")
    @Header("Content-Type", "application/vnd.api+json")
    async getMultipleRecords(@Search() search: JsonApiQuery): Promise<CollectionResourceDocument> {
        return this.options.adapter.multiple(search);
    }

    /**
     * Fetch a single record of a specific resource by ID.
     * @see https://jsonapi.org/format/#fetching-resources
     * @see https://jsonapi.org/format/#fetching-resources-responses
     * @see https://jsonapi.org/format/#fetching-resources-responses-404
     */
    @Get(":id")
    @Header("Content-Type", "application/vnd.api+json")
    async getRecordById(
        @Param("id") id: string,
    ): Promise<SingleResourceDocument> {
        return this.options.adapter.single(id);
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
     */
    @Post("")
    @Header("Content-Type", "application/vnd.api+json")
    async createRecord(
        @Body() body: SingleResourceDocument,
    ): Promise<PlainDocument> {
        return this.options.adapter.create(body);
    }

    /**
     * Update a record of a specific resource by ID.
     * @see https://jsonapi.org/format/#crud-updating
     */
    @Patch(":id")
    @Header("Content-Type", "application/vnd.api+json")
    async updateRecord(
        @Param("id") id: string,
        @Body() body: SingleResourceDocument,
    ): Promise<PlainDocument> {
        return this.options.adapter.update(id, body);
    }

    /**
     * Delete a record of a specific resource by ID.
     * @see https://jsonapi.org/format/#crud-deleting
     */
    @Delete(":id")
    @Header("Content-Type", "application/vnd.api+json")
    async deleteRecord(@Param("id") id: string): Promise<PlainDocument> {
        return this.options.adapter.remove(id);
    }
}
