import { Attributes, Meta } from "std-json-api/json-api";
import { JsonApiQuery } from "std-json-api/parser";

export type CreateResponse = {
  meta: {
    created: boolean;
    id: string;
  };
};

export type UpdateResponse = {
  meta: {
    id: string;
    updated: boolean;
  };
};

export type RemoveResponse = {
  meta: {
    id: string;
    deleted: boolean;
  };
};

export type SingleResponse<Model extends Attributes = Attributes> = {
  data: Model | null;
  meta?: Meta;
};

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
   * @param input
   */
  multiple(input: JsonApiQuery): Promise<MultipleResponse<Model>>;

  /**
   * Fetch a single record of a specific resource by ID.
   *
   * @param id
   */
  single(id: string): Promise<SingleResponse<Model>>;

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
