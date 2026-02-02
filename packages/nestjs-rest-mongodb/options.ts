import type { Collection, Document, MatchKeysAndValues } from "mongodb";
import { ObjectId } from "mongodb";
import type { Attributes, JsonApiQueryFilter } from "std-json-api";
import type { ResourceDescriptor } from "nestjs-rest";

export type Doc = Document & Attributes;
export type InputId = string | string[];

/**
 * Options for configuring the MongoDB adapter.
 */
export type MongodbAdapterOptions<T extends Doc> = {
  /**
   * Resource descriptor defining the resource structure.
   */
  descriptor: ResourceDescriptor;

  /**
   * MongoDB collection for the resource.
   */
  collection: Collection<T>;

  /**
   * Related collections for handling relationships.
   */
  relatedCollections: { [key: string]: string };

  /**
   * Factory function to create unique identifiers for documents.
   * @param input
   */
  uniqueFactory: (input: InputId) => MatchKeysAndValues<T>;

  /**
   * Optional factory function to create filter documents from JSON:API queries.
   * @param query
   */
  filterFactory: (query?: JsonApiQueryFilter) => Document;

  /**
   * Default page size for pagination.
   */
  defaultPageSize: number;
};

export function normalize<T extends Doc>(
  options: Partial<MongodbAdapterOptions<T>>,
) {
  // assert required options
  // ---------------------------

  if (!options.descriptor) {
    throw new Error("MongoAdapter requires ResourceDescriptor");
  }

  if (!options.collection) {
    throw new Error("MongoAdapter requires a collection");
  }

  // normalize options
  // ---------------------------

  if (!options.uniqueFactory) {
    const key = options.descriptor.idKey;

    if (!key) {
      // should not happen as idKey is required in ResourceDescriptor
      throw new Error(
        "MongoAdapter requires idKey in ResourceDescriptor to build uniqueFactory",
      );
    } else if (Array.isArray(key)) {
      // composite key
      options.uniqueFactory = (ids: InputId) => {
        if (ids.length !== key.length) {
          throw new Error(
            `Composite key requires ${key.length} values, but got ${ids.length}`,
          );
        }
        return key.reduce((acc, key) => {
          // we can safely assert here as we checked the length before
          acc[key] = (ids as string[]).shift()!;
          return acc;
        }, {} as Record<string, string>) as MatchKeysAndValues<T>;
      };
    } else if (key === "_id") {
      // mongo object id
      options.uniqueFactory = (
        id: InputId,
      ) => ({ _id: new ObjectId(id as string) } as MatchKeysAndValues<never>);
    } else {
      // simple key
      options.uniqueFactory = (
        id: InputId,
      ) => ({ [key]: id } as MatchKeysAndValues<never>);
    }
  }

  if (!options.filterFactory) {
    // if the user does not provide a filter factory
    // the results can lead to injection attacks
    // note: this is a very naive implementation
    // note: this is sometime the required behavior for advanced usage, just be cautious
    options.filterFactory = (filter?: JsonApiQueryFilter) => filter || {};
  }

  if (!options.defaultPageSize) {
    options.defaultPageSize = 10;
  }

  return options as MongodbAdapterOptions<T>;
}
