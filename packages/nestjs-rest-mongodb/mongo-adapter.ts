import {debuglog} from 'node:util';
import type {MatchKeysAndValues, OptionalUnlessRequiredId,} from "mongodb";
import {JsonApiQuery} from "std-json-api";
import type {
    CreateResponse,
    JsonApiAdapter,
    MultipleResponse,
    RemoveResponse,
    SingleResponse,
    UpdateResponse
} from "nestjs-rest";
import {Doc, InputId, MongodbAdapterOptions, normalize} from "./options";

const log = debuglog("nestjs-rest-mongodb");


function flattenInputId(id: InputId): string {
    return Array.isArray(id) ? id.join("/") : id;
}

/**
 * MongoDB adapter implementing the JsonApiAdapter interface.
 * Provides simple CRUD operations for resources stored in a MongoDB collection.
 * Supports simple and composite keys, as well as MongoDB ObjectId.
 * Remember to index your collections based on the fields you query frequently for optimal performance.
 */
export class MongoAdapter<T extends Doc> implements JsonApiAdapter<T> {
    private readonly options: MongodbAdapterOptions<T>;

    constructor(options: Partial<MongodbAdapterOptions<T>>) {
        this.options = normalize(options);
        log("MongoAdapter initialized with options: %O", this.options);
    }

    /**
     * Fetch multiple records based on the provided query.
     * @param query
     */
    async multiple(query: JsonApiQuery): Promise<MultipleResponse<T>> {
        const pipeline = this.options.pipeline(this.options, query);
        log("Executing aggregation pipeline: %O", pipeline);

        // Execute pipeline and extract results
        const results = await this.options.collection.aggregate(pipeline).toArray();
        const [{docs, total}] = results as [{ docs: T[], total: number }];
        log("Aggregation results - total: %d, docs count: %d", total, docs.length);

        return {
            data: docs || [],
            meta: {
                total: total || 0,
            }
        }
    }

    /**
     * Fetch a single record by its ID.
     * @param id
     * @param query
     */
    async single(id: InputId, query: JsonApiQuery): Promise<SingleResponse<T>> {
        const {resourceId} = this.options.descriptor;

        // TODO: Implement relationship inclusion (query.include) using $lookup stages

        // Build projection options from fields parameter
        const projection = query.fields && query.fields[resourceId]
            ? query.fields[resourceId]
            : undefined;

        const doc = await this.options.collection.findOne(
            this.options.uniqueFactory(id),
            projection ? {projection} : undefined
        );
        return {
            data: doc as T || null,
            meta: {
                id: flattenInputId(id),
            },
        };
    }

    /**
     * Create a new record with the provided data.
     * @param data
     */
    async create<R = T>(data: R): Promise<CreateResponse> {
        const {insertedId} = await this.options.collection.insertOne(
            data as OptionalUnlessRequiredId<T>,
        );
        return {
            meta: {
                created: true,
                id: String(insertedId),
            }
        }
    }

    /**
     * Update a record by its ID with the provided data.
     * @param id
     * @param data
     */
    async update<R = T>(id: InputId, data: Partial<R>): Promise<UpdateResponse> {
        const res = await this.options.collection.updateOne(
            this.options.uniqueFactory(id),
            {
                $set: data as MatchKeysAndValues<never>,
            },
        );
        return {
            meta: {
                updated: res.modifiedCount === 1,
                id: flattenInputId(id),
            },
        };
    }

    /**
     * Delete a record by its ID.
     * @param id
     */
    async remove(id: InputId): Promise<RemoveResponse> {
        await this.options.collection.deleteOne(this.options.uniqueFactory(id));
        return {
            meta: {
                id: flattenInputId(id),
                deleted: true,
            },
        };
    }
}