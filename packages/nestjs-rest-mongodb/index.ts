import type {Collection, Document, MatchKeysAndValues, OptionalUnlessRequiredId,} from "mongodb";
import {ObjectId} from "mongodb";
import JsonApiAdapter, {CreateResponse, RemoveResponse, UpdateResponse} from "nestjs-rest/adapter";
import {JsonApiQuery} from "std-json-api/query-string-parser";
import OffsetPagination from "nestjs-rest/pagination/offset-pagination";
import {
    AttributesObject,
    CollectionResourceDocument,
    SingleResource,
    SingleResourceDocument
} from "std-json-api/json-api";
import {
    Attributes,
    CollectionDocument,
    Data,
    Id,
    Links,
    Meta,
    Resource,
    SingleDocument,
    Type
} from "std-json-api/builder-fn";
import {NotFoundException} from "@nestjs/common";
import {ResourceDescriptor} from "std-json-api/descriptor";

// todo implement includes and relationships

// local types
type Doc = Document & AttributesObject;

export type MongodbAdapterOptions<T extends Doc> = {
    descriptor: ResourceDescriptor;
    collection: Collection<T>;
    collections: { [key: string]: string; };
    relatedCollections: { [key: string]: Collection; };
    uniqueFactory: (input: string) => MatchKeysAndValues<T>;
};


export default class MongodbAdapter<T extends Doc> implements JsonApiAdapter<T> {
    readonly options: MongodbAdapterOptions<T>;

    constructor(options: Partial<MongodbAdapterOptions<T>>) {
        if (!options.descriptor) {
            throw new Error("MongodbAdapter requires ResourceDescriptor");
        }
        //
        if (options.collections) {
            // todo check that all collection is defined by the descriptor
        } else if (options.collection && options.relatedCollections) {
            // todo check that collection is defined by the descriptor
        } else {
            throw new Error("MongodbAdapter requires either collections or collection and relatedCollections");
        }

        if (!options.uniqueFactory) {
            const key = options.descriptor.idKey;
            options.uniqueFactory = ('_id' === key)
                ? (id: string) => ({_id: new ObjectId(id)} as MatchKeysAndValues<any>)
                : (id: string) => ({[key]: id} as MatchKeysAndValues<any>);
        }

        this.options = options as MongodbAdapterOptions<T>;
    }

    /**
     * For more information about the input format, see
     * @see ../std-json-api/query-string-parser.ts
     *
     * @param input
     */
    async multiple(input: JsonApiQuery): Promise<CollectionResourceDocument> {
        const {resourceId, idKey} = this.options.descriptor;
        const {limit, offset} = input.page;
        const paginator = this.paginator(input);
        /**
         * Let's build the aggregation pipeline for searching...
         */
        const pipeline: Document[] = [];

        /**
         * Start with the match stage.
         */
        pipeline.push({$match: input.filter});

        /**
         * We must sort to keep pagination consistent
         * If specified, sort by the given fields
         */
        pipeline.push((Object.keys(input.sort).length > 0) ? {$sort: input.sort} : {$sort: {_id: 1}});

        /**
         * Add projection
         */
        if (input.fields && input.fields[resourceId]) {
            pipeline.push({$project: input.fields[resourceId]});
        }

        /**
         * Add pagination
         */
        pipeline.push({
            $facet: {
                metadata: [{$count: "total"}],
                data: [{$skip: offset}, {$limit: limit}],
            },
        });

        /**
         * collect the results
         */
        pipeline.push({
            $project: {
                docs: "$data",
                total: {$arrayElemAt: ["$metadata.total", 0]},
            },
        });

        const [{docs, total}] = await this.options.collection.aggregate(pipeline).toArray();


        // create the offset-based paginator if none was provided
        // const paginator = new OffsetPagination(`${baseUrl}/${resourceId}`, limit, offset, total);

        const data: SingleResource[] = [];

        // convert list into the list of resources
        for (const doc of docs) {
            data.push(Resource(
                Id(String(doc[idKey])),
                Type(resourceId),
                Attributes(doc as AttributesObject),
                Links(paginator.self(doc[idKey]))
            ));
        }

        // get the collection paginator
        const collPaginator = paginator.collection(limit, offset, total);

        // create the collection document
        return CollectionDocument(
            Links(collPaginator.pagination()),
            Meta(collPaginator.metadata()),
            Data(data),
        );
    }

    async single(id: string): Promise<SingleResourceDocument> {
        const doc = await this.options.collection.findOne(
            this.options.uniqueFactory(id),
        );
        if (!doc) {
            throw new NotFoundException(`No document with id ${id}`);
        }
        return SingleDocument(
            Links(this.paginator().self(id)),
            Meta({id}),
            Data(Resource(
                Id(id),
                Type(this.options.descriptor.resourceId),
                Attributes(doc as AttributesObject),
            ))
        );
    }

    async create<R = T>(data: R): Promise<CreateResponse> {
        const {insertedId} = await this.options.collection.insertOne(
            data as OptionalUnlessRequiredId<T>,
        );
        return SingleDocument(
            Meta({
                created: true,
                id: String(insertedId),
            }),
            Links(this.paginator().self(String(insertedId))),
            Data(null)
        );
    }

    async update<R = T>(id: string, data: Partial<R>): Promise<UpdateResponse> {
        const res = await this.options.collection.updateOne(
            this.options.uniqueFactory(id),
            {
                $set: data as MatchKeysAndValues<any>,
            },
        );
        return SingleDocument(
            Meta({
                updated: res.modifiedCount === 1,
                id,
            }),
            Links(this.paginator().self(id)),
            Data(null)
        );
    }

    async remove(id: string): Promise<RemoveResponse> {
        await this.options.collection.deleteOne(this.options.uniqueFactory(id));
        return SingleDocument(
            Meta({
                id,
                deleted: true,
            }),
            Data(null)
        );
    }

    protected paginator(input: object = {}) {
        const {baseUrl, resourceId} = this.options.descriptor;
        return new OffsetPagination(`${baseUrl}/${resourceId}`, input);
    }
}
