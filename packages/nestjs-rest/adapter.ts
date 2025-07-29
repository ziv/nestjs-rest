import type {
  RestAdapterFilter,
  RestAdapterPagination,
  RestAdapterSorting,
} from "./search";
import { AttributesObject } from "std-json-api/json-api-types";

export type MultipleArgs<Pagination = RestAdapterPagination> = {
  filter: RestAdapterFilter;
  sort: RestAdapterSorting;
  page: Pagination; // todo make generic
  [key: string]: any;
};

export default interface JsonApiAdapter<
  Model extends AttributesObject = AttributesObject,
> {
  /**
   * Create a new resource document and return metadata.
   *
   * @param data
   */
  create<R extends Model = Model>(data: R): Promise<{
    meta: {
      created: boolean;
      id: string;
    };
  }>;

  /**
   * Fetch multiple records of a specific resource.
   *
   * @param input
   */
  multiple(
    input: MultipleArgs,
  ): Promise<{
    data: {
      id: string;
      attributes: AttributesObject;
    }[];
    total: number;
  }>;

  /**
   * Fetch a single record of a specific resource by ID.
   *
   * @param id
   */
  single(
    id: string,
  ): Promise<{
    data: {
      id: string;
      attributes: AttributesObject;
    } | null;
  }>;

  /**
   * Update a resource document by ID and return metadata.
   *
   * @param id
   * @param data
   */
  update<R = Model>(id: string, data: Partial<R>): Promise<{
    meta: {
      id: string;
      updated: boolean;
    };
  }>;

  /**
   * Delete a resource document by ID and return metadata.
   *
   * @param id
   */
  remove(id: string): Promise<{
    meta: {
      id: string;
      deleted: boolean;
    };
  }>;
}
