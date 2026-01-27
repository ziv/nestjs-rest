import {Document} from "mongodb";
import {JsonApiQuery, OffsetPagination} from "std-json-api/parser";
import {MongodbAdapterOptions} from "../options";

/**
 * Offset-based pagination pipeline for MongoDB.
 * Generates an aggregation pipeline to handle offset-based pagination,
 * including filtering, sorting, sparse fieldsets, and total count.
 *
 * Return shape is:
 * [
 *  {
 *   docs: [...],
 *   total: number
 *  }
 * ]
 * @param options
 * @param query
 * @constructor
 */
export function OffsetPipeline(options: MongodbAdapterOptions<any>, query: JsonApiQuery): Document[] {
    const pipeline: Document[] = [];

    // stage 1: $match - apply filters
    pipeline.push({$match: options.filterFactory(query.filter)});

    // stage 2: $sort - apply sorting with default fallback
    const sortStage: Record<string, 1 | -1> = query.sort && Object.keys(query.sort).length > 0 ? query.sort : {_id: 1};
    pipeline.push({$sort: sortStage});

    // stage 3: $project - apply sparse fieldsets if specified
    // todo need to check that solution is valid...
    if (query.fields && query.fields[options.descriptor.resourceId]) {
        pipeline.push({$project: query.fields[options.descriptor.resourceId]});
    }

    // stage 4: pagination and count
    const page = query.page as OffsetPagination;
    const offset = page?.['offset'] ?? 0;
    const limit = page?.['limit'] ?? 10;

    pipeline.push({
        $facet: {
            metadata: [
                {$count: "total"},
            ],
            data: [
                {$skip: offset},
                {$limit: limit},
            ],
        },
    });

    // stage 5: reshape output
    pipeline.push({
        $project: {
            docs: "$data",
            total: {$arrayElemAt: ["$metadata.total", 0]},
        },
    });

    return pipeline;
}