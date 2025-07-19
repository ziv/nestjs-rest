import {
  Body,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { PaginationAndSort } from "./primitives";
import type { RestAdapter } from "./adapter";
import type {
  Item,
  Items,
  QuerySchema,
  RestFilter,
  RestModel,
} from "./primitives";

export type RestControllerOptions = {
  /**
   * Array of REST adapters that provide CRUD operations for different resources.
   */
  adapters: RestAdapter[];
};

export default class RestController {
  protected readonly resources: Record<string, RestAdapter> = {};

  constructor(options: RestControllerOptions) {
    for (const adapter of options.adapters) {
      if (adapter.id() in this.resources) {
        throw new Error(
          `Resource adapter with id "${adapter.id()}" already exists`,
        );
      }
      this.resources[adapter.id()] = adapter;
    }
  }

  /**
   * Search for records of a specific resource.
   *
   * @param resource
   * @param query
   * @param filter
   */
  @Post(":resource/search")
  searchRecords(
    @Param("resource") resource: string,
    @Query() query: Partial<QuerySchema>,
    @Body() filter: RestFilter,
  ): Promise<Items> {
    return this.#find(resource, query, filter);
  }

  @Get(":resource")
  getMultipleRecords(
    @Param("resource") resource: string,
    @Query() query: Partial<QuerySchema>,
  ): Promise<Items> {
    return this.#find(resource, query);
  }

  /**
   * Get a single record of a specific resource by ID.
   *
   * @param resource
   * @param id
   */
  @Get(":resource/:id")
  async getSingleRecord(
    @Param("resource") resource: string,
    @Param("id") id: string,
  ): Promise<Item> {
    const item = await this.#getAdapterByResource(resource).single(id);
    if (!item) {
      throw new NotFoundException(`item "${id}" not found`);
    }
    return {
      data: item,
    };
  }

  @Post(":resource")
  async createRecord(
    @Param("resource") resource: string,
    @Body() data: RestModel,
  ): Promise<Item<string>> {
    const insertId = await this.#getAdapterByResource(resource).create(data);
    return {
      data: insertId,
    };
  }

  @Put(":resource/:id")
  async updateRecord(
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() data: RestModel,
  ): Promise<Item<boolean>> {
    await this.#getAdapterByResource(resource).replace(id, data);
    return {
      data: true,
    };
  }

  @Patch(":resource/:id")
  async patchRecord(
    @Param("resource") resource: string,
    @Param("id") id: string,
    @Body() data: Partial<RestModel>,
  ): Promise<Item<boolean>> {
    await this.#getAdapterByResource(resource).update(id, data);
    return {
      data: true,
    };
  }

  @Delete(":resource/:id")
  async removeRecord(
    @Param("resource") resource: string,
    @Param("id") id: string,
  ): Promise<Item<boolean>> {
    await this.#getAdapterByResource(resource).remove(id);
    return {
      data: true,
    };
  }

  async #find(
    resource: string,
    query: Partial<QuerySchema>,
    filter: RestFilter = {},
  ): Promise<Items> {
    const parsed = PaginationAndSort.parse(query);
    const { data, total } = await this.#getAdapterByResource(resource).multiple(
      filter,
      parsed,
    );
    return {
      data,
      total,
      page: parsed.page,
      size: parsed.size,
    };
  }

  #getAdapterByResource(resource: string): RestAdapter {
    if (resource in this.resources) {
      return this.resources[resource];
    }
    throw new NotFoundException(`resource "${resource}" not found`);
  }
}
