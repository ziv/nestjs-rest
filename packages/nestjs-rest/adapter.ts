import { Attributes, Meta } from "std-json-api/json-api";
import { JsonApiQuery } from "std-json-api/parser";

/**
 * Response returned after creating a resource.
 */
export type CreateResponse = {
  meta: {
    created: boolean;
    id: string;
  };
};

/**
 * Response returned after updating a resource.
 */
export type UpdateResponse = {
  meta: {
    id: string;
    updated: boolean;
  };
};

/**
 * Response returned after removing a resource.
 */
export type RemoveResponse = {
  meta: {
    id: string;
    deleted: boolean;
  };
};

/**
 * Response containing a single resource or null.
 */
export type SingleResponse<Model extends Attributes = Attributes> = {
  data: Model | null;
  meta?: Meta;
};

/**
 * Response containing multiple resources.
 */
export type MultipleResponse<Model extends Attributes = Attributes> = {
  data: Model[];
  meta?: Meta;
};

export interface JsonApiAdapter<Model extends Attributes = Attributes> {
  /**
   * Create a new resource document and return metadata.
   *
   * @param data
   */
  create<R = Model>(data: R): Promise<CreateResponse>;

  /**
   * Fetch multiple records of a specific resource.
   *
   * @param query
   */
  multiple(query: JsonApiQuery): Promise<MultipleResponse<Model>>;

  /**
   * Fetch a single record of a specific resource by ID.
   *
   * @param id
   * @param query
   */
  single(id: string, query: JsonApiQuery): Promise<SingleResponse<Model>>;

  /**
   * Update a resource document by ID and return metadata.
   *
   * @param id
   * @param data
   */
  update<R = Model>(id: string, data: Partial<R>): Promise<UpdateResponse>;

  /**
   * Delete a resource document by ID and return metadata.
   *
   * @param id
   */
  remove(id: string): Promise<RemoveResponse>;
}
