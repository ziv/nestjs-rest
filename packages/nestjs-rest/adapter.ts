import type {JsonApiQuery} from "std-json-api/query-string-parser";
import {AttributesObject, CollectionResourceDocument, SingleResourceDocument} from "std-json-api/json-api";

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

export default interface JsonApiAdapter<
    Model extends AttributesObject = AttributesObject,
> {
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
    multiple(input: JsonApiQuery): Promise<CollectionResourceDocument>;

    /**
     * Fetch a single record of a specific resource by ID.
     *
     * @param id
     */
    single(id: string): Promise<SingleResourceDocument>;

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
