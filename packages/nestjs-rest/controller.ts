import {
  BadRequestException,
  Body,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type {
  AttributesObject,
  CollectionResourceDocument,
  PlainDocument,
  SingleResourceDocument,
} from "std-json-api/json-api-types";
import { ZodType } from "zod";
import JsonApiAdapter, { type MultipleArgs } from "./adapter";
import Search, { type SearchDescriptor } from "./search";
import {
  attributes,
  collectionDocument,
  dataCollection,
  dataResource,
  identifier,
  jsonApi,
  links,
  meta,
  resource,
  resourceDocument,
} from "std-json-api/json-api";
import { createDocument, updateDocument } from "std-json-api/json-api-schema";
import JsonApiPaginator from "./paginator";

// todo should add pagination strategy to the controller options?
// todo error handler, return ErrorDocument on error

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

export default class JsonApiController<
  Model extends AttributesObject = AttributesObject,
> {
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
  async getMultipleRecords(
    @Search() search: SearchDescriptor,
  ): Promise<CollectionResourceDocument<Model>> {
    // todo missing more keys to read from multiple (include, fields, etc.)
    const { data, total } = await this.options.adapter.multiple(
      search as MultipleArgs,
    );

    const paginate = JsonApiPaginator.collection({
      baseUrl: this.options.baseUrl,
      resource: this.options.resourceId,
      parsed: search,
      limit: search.page.limit,
      offset: search.page.offset,
      total,
    });

    return collectionDocument(
      links({
        self: paginate.self(),
        first: paginate.first(),
        last: paginate.last(),
        next: paginate.next(),
        prev: paginate.previous(),
      }),
      meta({
        total,
        limit: search.page.limit,
        offset: search.page.offset,
      }),
      dataCollection(data.map((el) => {
        const resourcePaginate = JsonApiPaginator.resource({
          baseUrl: this.options.baseUrl,
          resource: this.options.resourceId,
          parsed: search,
          id: el.id,
        });
        return resource(
          identifier(el.id, this.options.resourceId),
          attributes(el.attributes),
          links({
            self: resourcePaginate.self(),
          }),
        );
      })),
    );
  }

  /**
   * Fetch a single record of a specific resource by ID.
   * @see https://jsonapi.org/format/#fetching-resources
   * @see https://jsonapi.org/format/#fetching-resources-responses
   * @see https://jsonapi.org/format/#fetching-resources-responses-404
   *
   * @param id
   */
  @Get(":id")
  @Header("Content-Type", "application/vnd.api+json")
  async getRecordById(
    @Param("id") id: string,
  ): Promise<SingleResourceDocument<Model>> {
    const res = await this.options.adapter.single(id);
    if (!res.data) {
      throw new NotFoundException("Resource not found");
    }
    return resourceDocument(
      meta({
        id,
      }),
      dataResource(resource(
        identifier(res.data.id, this.options.resourceId),
        attributes(res.data.attributes),
        links({}), // todo missing self link
      )),
    );
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
   * @param body
   */
  @Post("")
  @Header("Content-Type", "application/vnd.api+json")
  async createRecord(
    @Body() body: SingleResourceDocument<Model>,
  ): Promise<PlainDocument> {
    const parsed = createDocument.safeParse(body);
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
    const metaData = await this.options.adapter.create(doc.data as any);
    return jsonApi(meta(metaData));
  }

  /**
   * Update a record of a specific resource by ID.
   * @ssee https://jsonapi.org/format/#crud-updating
   *
   * @param id
   * @param body
   */
  @Patch(":id")
  @Header("Content-Type", "application/vnd.api+json")
  async updateRecord(
    @Param("id") id: string,
    @Body() body: SingleResourceDocument<Model>,
  ): Promise<PlainDocument> {
    const parsed = updateDocument.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        "Invalid JSON:API document",
        parsed.error.message,
      );
    }
    const doc = this.options.updateSchema.safeParse(parsed.data);
    if (!doc.success) {
      throw new BadRequestException(
        "Invalid resource data",
        doc.error.message,
      );
    }
    // todo get rid of this any
    const metaData = await this.options.adapter.update(id, doc.data as Model);
    return jsonApi(meta(metaData));
  }

  /**
   * Delete a record of a specific resource by ID.
   * @see https://jsonapi.org/format/#crud-deleting
   *
   * @param id
   */
  @Delete(":id")
  @Header("Content-Type", "application/vnd.api+json")
  async deleteRecord(@Param("id") id: string): Promise<PlainDocument> {
    const metaData = await this.options.adapter.remove(id);
    return jsonApi(meta(metaData));
  }
}
