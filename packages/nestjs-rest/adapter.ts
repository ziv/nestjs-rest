import type { QuerySchema, RestFilter, RestModel } from "./primitives";

/**
 * Generic interface for a REST adapter that provides methods for CRUD operations.
 */
export type RestAdapter<
  Model extends RestModel = RestModel,
  Filter extends RestFilter = RestFilter,
> = {
  /**
   * Returns the identifier for the adapter, typically the resource name.
   * Represents the resource in the API URL.
   */
  id(): string;

  /**
   * Finds multiple items based on a query and pagination.
   *
   * @param filter
   * @param query
   */
  multiple<R = Model>(
    filter: Filter,
    query: QuerySchema,
  ): Promise<{ data: R[]; total: number }>;

  /**
   * Finds a single item by its primary identifier.
   *
   * @param id
   */
  single<R = Model>(id: string): Promise<R | null>;

  /**
   * Creates a new item.
   *
   * @param data
   */
  create(data: Model): Promise<string>;

  /**
   * Replaces an existing item by its identifier.
   *
   * @param id
   * @param data
   */
  replace(id: string, data: Model): Promise<boolean>;

  /**
   * Updates an existing item by its identifier.
   *
   * @param id
   * @param data
   */
  update(id: string, data: Partial<Model>): Promise<boolean>;

  /**
   * Deletes an item by its identifier.
   *
   * @param id
   */
  remove(id: string): Promise<boolean>;
};
