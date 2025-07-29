import type {
  Collection,
  Document,
  Filter,
  MatchKeysAndValues,
  OptionalUnlessRequiredId,
} from "mongodb";
import { ObjectId } from "mongodb";
import JsonApiAdapter, { type MultipleArgs } from "nestjs-rest/adapter";
import type { AttributesObject } from "std-json-api/json-api-types";

export type MongodbAdapterOptions<T extends Document> = {
  /**
   * Resource id
   */
  id: string;

  /**
   * MongoDB collection that represents the resource.
   */
  collection: Collection<T>;

  /**
   * Project primary key
   */
  primaryKey: string;

  /**
   * Create a filter by unique identifier.
   *
   * @param id
   */
  uniqueFactory: (input: string) => Filter<T>;
};

export default class MongodbAdapter<T extends Document & AttributesObject>
  implements JsonApiAdapter<T> {
  readonly options: MongodbAdapterOptions<T>;

  /**
   * @param options
   */
  constructor(options: Partial<MongodbAdapterOptions<T>>) {
    if (!options.primaryKey) {
      options.primaryKey = "_id";
    }
    if (!options.uniqueFactory) {
      if (options.primaryKey !== "_id") {
        options.uniqueFactory = (
          id,
        ) => ({ [options.primaryKey as string]: id } as Filter<T>);
      } else {
        options.uniqueFactory = (
          id: string,
        ) => ({ _id: new ObjectId(id) } as Filter<T>);
      }
    }
    this.options = options as MongodbAdapterOptions<T>;
  }

  async multiple(
    input: MultipleArgs,
  ): Promise<{
    data: {
      id: string;
      attributes: AttributesObject;
    }[];
    total: number;
  }> {
    console.log(">>>", input);
    // todo build/validate the input
    const $match = input.filter;

    const $project = (input.fields && input.fields[this.options.id])
      ? input.fields[this.options.id].split(",").reduce(
        (acc: { [key: string]: 1 }, cur: string) => ({
          ...acc,
          [cur]: 1,
        }),
        {},
      )
      : {};

    const $sort = (input.sort && Object.keys(input.sort ?? {}).length > 0)
      ? input.sort
      : { _id: 1 };

    const pipeline = this.options.collection.aggregate([
      // search pipeline with counting total res (without the pagination)
      { $match },
      // we must sort to keep pagination consistent
      { $sort },
      // project items if specified
      { $project },
      // pagination
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: input.page.offset }, { $limit: input.page.limit }],
        },
      },
      // collect the results
      {
        $project: {
          data: "$data",
          total: { $arrayElemAt: ["$metadata.total", 0] },
        },
      },
    ]);

    const [{ data, total }] = await pipeline.toArray();
    const ret: { id: string; attributes: AttributesObject }[] = [];
    for (const doc of data) {
      const { [this.options.primaryKey]: id, ...attributes } =
        doc as AttributesObject;
      ret.push({ id, attributes });
    }

    return { data: ret, total };
  }

  async single(id: string): Promise<{
    data: {
      id: string;
      attributes: AttributesObject;
    } | null;
  }> {
    const doc = await this.options.collection.findOne(
      this.options.uniqueFactory(id),
    );
    if (!doc) {
      return { data: null };
    }
    const { [this.options.primaryKey]: extractedId, ...attributes } = doc;
    return {
      data: {
        id: String(extractedId),
        attributes,
      },
    };
  }

  async create<R extends T = T>(data: R): Promise<{
    meta: {
      created: boolean;
      id: string;
    };
  }> {
    const { insertedId } = await this.options.collection.insertOne(
      data as OptionalUnlessRequiredId<T>,
    );
    return {
      meta: {
        created: true,
        id: String(insertedId),
      },
    };
  }

  async update<R = T>(id: string, data: Partial<R>): Promise<{
    meta: {
      id: string;
      updated: boolean;
    };
  }> {
    const res = await this.options.collection.updateOne(
      this.options.uniqueFactory(id),
      {
        $set: data as MatchKeysAndValues<any>,
      },
    );
    return {
      meta: {
        id: String(id),
        updated: res.modifiedCount === 1,
      },
    };
  }

  async remove(id: string): Promise<{
    meta: {
      id: string;
      deleted: boolean;
    };
  }> {
    await this.options.collection.deleteOne(this.options.uniqueFactory(id));
    return {
      meta: {
        id: String(id),
        deleted: true,
      },
    };
  }
}
