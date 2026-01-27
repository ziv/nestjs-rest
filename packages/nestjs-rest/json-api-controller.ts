import {
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
  JsonApiDocumentBase,
  JsonApiQuery,
  JsonApiSingleDocument,
  ResourceDescriptor,
  ResourceObject,
} from "std-json-api";
import {
  JsonApiDocumentBuilder,
  JsonApiCollectionDocumentBuilder,
  JsonApiMetaDocumentBuilder,
} from "std-json-api";
import type { JsonApiAdapter } from "./adapter";
import { JsonQuery } from "./json-query";

/**
 * Configuration options for the JSON:API controller.
 */
export type JsonApiControllerOptions = {
  /**
   * REST adapter that provides CRUD operations for the resource.
   * It should implement the `JsonApiAdapter` interface.
   *
   * @see https://jsonapi.org/format/#crud
   */
  adapter: JsonApiAdapter;

  /**
   * Resource descriptor defining the resource type, ID key, and base URL.
   * Used to transform model objects into JSON:API resource objects.
   */
  resourceDescriptor: ResourceDescriptor;
};

/**
 * Base JSON:API controller implementing standard CRUD operations.
 *
 * This controller provides five REST endpoints following the JSON:API v1.1 specification:
 * - GET / - List resources with filtering, sorting, and pagination
 * - GET /:id - Get a single resource by ID
 * - POST / - Create a new resource
 * - PATCH /:id - Update an existing resource
 * - DELETE /:id - Delete a resource
 *
 * All responses follow the JSON:API document structure and include the
 * `Content-Type: application/vnd.api+json` header.
 *
 * @example
 * ```ts
 * @Controller('articles')
 * export class ArticlesController extends JsonApiController {
 *   constructor(articlesAdapter: ArticlesAdapter) {
 *     super({
 *       adapter: articlesAdapter,
 *       resourceDescriptor: {
 *         resourceId: 'articles',
 *         baseUrl: '/api/articles',
 *         idKey: '_id',
 *         attributes: {
 *           title: 'string',
 *           body: 'string',
 *           publishedAt: 'date'
 *         }
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/
 */
export class JsonApiController {
  constructor(readonly options: JsonApiControllerOptions) {
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
   * @param query - Parsed JSON:API query parameters
   * @returns Collection document with resource array and metadata
   *
   * @see https://jsonapi.org/format/#fetching-resources
   * @see https://jsonapi.org/format/#fetching-resources-responses
   */
  @Get("")
  @Header("Content-Type", "application/vnd.api+json")
  async multiple(
    @JsonQuery() query: JsonApiQuery,
  ): Promise<JsonApiCollectionDocument> {
    const result = await this.options.adapter.multiple(query);
    const resources = result.data.map((model) =>
      this.transformModelToResource(model)
    );
    return new JsonApiCollectionDocumentBuilder()
      .data(resources)
      .metadata(result.meta)
      .links({
        self: this.options.resourceDescriptor.baseUrl,
      })
      .build();
  }

  /**
   * Fetch a single record of a specific resource by ID.
   *
   * Returns a 404 Not Found error if the resource doesn't exist.
   *
   * @param id - The resource identifier
   * @param query
   * @returns Single resource document
   *
   * @see https://jsonapi.org/format/#fetching-resources
   * @see https://jsonapi.org/format/#fetching-resources-responses-200
   * @see https://jsonapi.org/format/#fetching-resources-responses-404
   */
  @Get(":id")
  @Header("Content-Type", "application/vnd.api+json")
  async single(
    @Param("id") id: string,
    @JsonQuery() query: JsonApiQuery,
  ): Promise<JsonApiSingleDocument> {
    const model = await this.options.adapter.single(id, query);
    if (!model.data) {
      throw new NotFoundException({
        errors: [
          {
            status: "404",
            title: "Resource Not Found",
            detail: `The requested resource with id '${id}' was not found.`,
          },
        ],
      });
    }
    const resource = this.transformModelToResource(model, id);
    return new JsonApiDocumentBuilder()
      .data(resource)
      .links({
        self: `${this.options.resourceDescriptor.baseUrl}/${id}`,
      })
      .build();
  }

  /**
   * Create a new resource.
   *
   * Accepts a JSON:API document with resource data and returns the created
   * resource with a 201 Created status.
   *
   * @param body - JSON:API document with resource data
   * @returns Single resource document with creation metadata
   *
   * @see https://jsonapi.org/format/#crud-creating
   * @see https://jsonapi.org/format/#crud-creating-responses-201
   */
  @Post("")
  @Header("Content-Type", "application/vnd.api+json")
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { data: { attributes: Attributes } },
  ): Promise<JsonApiDocumentBase> {
    const createResponse = await this.options.adapter.create(
      body.data.attributes,
    );

    return new JsonApiMetaDocumentBuilder()
      .metadata({
        created: createResponse.meta.created,
        id: createResponse.meta.id,
      })
      .links({
        self:
          `${this.options.resourceDescriptor.baseUrl}/${createResponse.meta.id}`,
      })
      .build();
  }

  /**
   * Update an existing resource by ID.
   *
   * Accepts a JSON:API document with partial resource data and returns
   * the updated resource with a 200 OK status.
   *
   * @param id - The resource identifier
   * @param body - JSON:API document with partial resource data
   * @returns Single resource document with update metadata
   *
   * @see https://jsonapi.org/format/#crud-updating
   * @see https://jsonapi.org/format/#crud-updating-responses-200
   * @see https://jsonapi.org/format/#crud-updating-responses-404
   */
  @Patch(":id")
  @Header("Content-Type", "application/vnd.api+json")
  async update(
    @Param("id") id: string,
    @Body() body: { data: { attributes: Partial<Attributes> } },
  ): Promise<JsonApiDocumentBase> {
    const updateResponse = await this.options.adapter.update(
      id,
      body.data.attributes,
    );
    return new JsonApiMetaDocumentBuilder()
      .metadata({
        updated: updateResponse.meta.updated,
        id: updateResponse.meta.id,
      })
      .links({
        self: `${this.options.resourceDescriptor.baseUrl}/${id}`,
      })
      .build();
  }

  /**
   * Delete a resource by ID.
   *
   * Returns a 204 No Content status on successful deletion.
   *
   * @param id - The resource identifier
   *
   * @see https://jsonapi.org/format/#crud-deleting
   * @see https://jsonapi.org/format/#crud-deleting-responses-204
   * @see https://jsonapi.org/format/#crud-deleting-responses-404
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string): Promise<JsonApiDocumentBase> {
    const removeResponse = await this.options.adapter.remove(id);
    return new JsonApiMetaDocumentBuilder()
      .metadata({
        deleted: removeResponse.meta.deleted,
        id: removeResponse.meta.id,
      })
      .build();
  }

  /**
   * Transform a model object into a JSON:API resource object.
   *
   * This method extracts the ID from the model based on the configured
   * `idKey` and maps the model properties to resource attributes.
   *
   * @param model - The model object from the adapter
   * @param explicitId - Optional explicit ID (used when ID is known from context)
   * @returns A JSON:API resource object
   *
   * @internal
   */
  protected transformModelToResource(
    model: Attributes,
    explicitId?: string,
  ): ResourceObject {
    const descriptor = this.options.resourceDescriptor;

    // Extract ID from model based on idKey configuration
    let id: string;
    if (explicitId) {
      id = explicitId;
    } else if (Array.isArray(descriptor.idKey)) {
      // Composite key: join multiple fields
      id = descriptor.idKey
        .map((key) => String(model[key]))
        .join("-");
    } else {
      // Single key field
      id = String(model[descriptor.idKey]);
    }

    // Extract attributes
    const attributes: Attributes = { ...model };

    // Build resource object
    return {
      type: descriptor.resourceId,
      id,
      attributes,
      links: {
        self: `${descriptor.baseUrl}/${id}`,
      },
    };
  }
}
