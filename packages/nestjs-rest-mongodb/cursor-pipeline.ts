import { Document } from "mongodb";
import { CursorPagination, JsonApiQuery } from "std-json-api/parser";
import { MongodbAdapterOptions } from "./options";

/**
 * Cursor-based pagination pipeline for MongoDB.
 * Generates an aggregation pipeline to handle cursor-based pagination,
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
export function CursorPipeline(
  options: MongodbAdapterOptions<any>,
  query: JsonApiQuery,
): Document[] {
  const pipeline: Document[] = [];

  const page = query.page as CursorPagination;
  const limit = page.limit ?? 10;
  const cursor = page.cursor ?? null;

  // stage 1: $match - apply filters
  // add the cursor filter only if cursor is provided
  const filter = cursor
    ? {
      $and: [
        options.filterFactory(query.filter),
        { [page.field]: { $gt: cursor } },
      ],
    }
    : options.filterFactory(query.filter);
  pipeline.push({ $match: filter });

  // stage 2: $sort - apply sorting with default fallback
  const sortStage: Record<string, 1 | -1> =
    query.sort && Object.keys(query.sort).length > 0 ? query.sort : { _id: 1 };
  // ensure the sort field includes the cursor field
  if (!(page.field in sortStage)) {
    sortStage[page.field] = 1; // default to ascending
  }
  pipeline.push({ $sort: sortStage });

  // stage 3: $project - apply sparse fieldsets if specified
  // todo need to check that solution is valid...
  if (query.fields && query.fields[options.descriptor.resourceId]) {
    pipeline.push({ $project: query.fields[options.descriptor.resourceId] });
  }

  // stage 4: limit and count
  pipeline.push({
    $facet: {
      metadata: [
        { $count: "total" },
      ],
      data: [
        { $limit: limit },
      ],
    },
  });

  // stage 5: reshape output
  pipeline.push({
    $project: {
      docs: "$data",
      total: { $arrayElemAt: ["$metadata.total", 0] },
    },
  });

  return pipeline;
}
