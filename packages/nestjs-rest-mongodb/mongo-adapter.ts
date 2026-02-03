import {debuglog} from "node:util";
import type {Filter, MatchKeysAndValues, OptionalUnlessRequiredId,} from "mongodb";
import type {JsonApiQuery, JsonApiQueryFields, JsonApiQueryFilter,} from "std-json-api";
import type {JsonApiAdapter} from "nestjs-rest";
import type {Doc, InputId, MongodbAdapterOptions} from "./options";
import {normalize} from "./options";

const log = debuglog("nestjs-rest-mongodb");

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
     * Count the total number of records matching the query.
     * @param query
     */
    async count(query: JsonApiQuery): Promise<number> {
        return await this.options.collection.countDocuments(
            this.options.filterFactory(
                query.filter as JsonApiQueryFilter,
            ) as Filter<T>
        );
    }

    /**
     * Fetch multiple records based on the provided query.
     * todo add cursor based pagination support
     * @param query
     */
    async multiple(query: JsonApiQuery): Promise<T[]> {
        const filter = this.options.filterFactory(
            query.filter as JsonApiQueryFilter,
        ) as Filter<T>;
        const sort = query.sort ?? {_id: 1} as Record<string, 1 | -1>;
        const limit = query.page && "limit" in query.page && query.page.limit > 0
            ? query.page.limit
            : this.options.defaultPageSize;
        const offset = query.page && "offset" in query.page
            ? query.page.offset
            : 0;
        const project = query.fields[this.options.descriptor.resourceId];

        let cursor = this.options.collection.find(filter);

        if (project) {
            cursor = cursor.project(project);
        }

        const items = await cursor
            .sort(sort)
            .limit(limit)
            .skip(offset)
            .toArray() as T[];

        // convert _id to string for JSON:API compliance
        return items.map((item) => ({...item, _id: String(item._id)}));
    }

    /**
     * Fetch a single record by its ID.
     * @param id
     * @param fields
     */
    async single(
        id: string,
        fields?: JsonApiQueryFields["item"],
    ): Promise<T | null> {
        const item = await this.options.collection.findOne(
            this.options.uniqueFactory(id),
            fields ? {projection: fields} : undefined,
        ) as T | null;
        if (item) {
            return {...item, _id: String(item._id)};
        }
        return null;
    }

    /**
     * Create a new record with the provided data.
     * @param data
     */
    async create<R = T>(data: R): Promise<string> {
        const {insertedId} = await this.options.collection.insertOne(
            data as OptionalUnlessRequiredId<T>,
        );
        return String(insertedId);
    }

    /**
     * Update a record by its ID with the provided data.
     * @param id
     * @param data
     */
    async update<R = T>(id: InputId, data: Partial<R>): Promise<boolean> {
        const res = await this.options.collection.updateOne(
            this.options.uniqueFactory(id),
            {
                $set: data as MatchKeysAndValues<never>,
            },
        );
        return res.modifiedCount === 1;
    }

    /**
     * Delete a record by its ID.
     * @param id
     */
    async remove(id: InputId): Promise<boolean> {
        await this.options.collection.deleteOne(this.options.uniqueFactory(id));
        return true;
    }
}
