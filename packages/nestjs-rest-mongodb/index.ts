import type { QuerySchema, RestAdapter } from "nestjs-rest";
import type {
  Collection,
  Document,
  Filter,
  OptionalUnlessRequiredId,
} from "mongodb";
import { ObjectId } from "mongodb";
import type { ZodType } from "zod";

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
   * Record creation validation schema.
   */
  creationSchema: ZodType;

  /**
   * Record update validation schema. Defaults to `creationSchema`.
   */
  updateSchema?: ZodType;

  /**
   * How to project multiple records.
   */
  projectItems?: Record<string, 0 | 1>;

  /**
   * How to project a single record.
   */
  projectItem?: Record<string, 0 | 1>;

  /**
   * Unique key for the resource. If not provided, defaults to `_id`.
   */
  uniqueKey?: string;

  /**
   * Factory function to create a unique filter for the resource.
   *
   * @param id
   */
  uniqueFactory?: (id: string) => Filter<T>;
};

export default class MongodbAdapter<T extends Document>
  implements RestAdapter<T, Filter<T>> {
  /**
   *
   * @param options
   */
  constructor(readonly options: MongodbAdapterOptions<T>) {
  }

  id(): string {
    return this.options.id;
  }

  async multiple<R = T>(
    filter: Filter<T> = {},
    query: QuerySchema,
  ): Promise<{ data: R[]; total: number }> {
    const { dir, page, size, sort } = query;

    const key = sort ?? "_id";
    const direction = dir === "asc" ? 1 : -1;

    const pipeline: Document[] = [
      // search pipeline with counting total res (without the pagination)
      { $match: filter },
      // we must sort to keep pagination consistent
      { $sort: { [key]: direction } },
    ];

    if (this.options.projectItems) {
      // project items if specified
      pipeline.push({ $project: this.options.projectItems });
    }

    pipeline.push(
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: size * page }, { $limit: size }],
        },
      },
      {
        $project: {
          data: "$data",
          total: { $arrayElemAt: ["$metadata.total", 0] },
        },
      },
    );

    const [{ data, total }] = await this.options.collection.aggregate(pipeline)
      .toArray();
    return { data, total };
  }

  async single<R = T>(id: string): Promise<R | null> {
    const options = { projection: this.options.projectItem ?? {} };
    const item = await this.options.collection.findOne<R>(
      this.#uniqueId(id),
      options,
    );
    return item ?? null;
  }

  async create(data: T): Promise<string> {
    const item = this.options.creationSchema.parse(
      data,
    ) as OptionalUnlessRequiredId<T>;
    const res = await this.options.collection.insertOne(item);
    return res.insertedId.toString();
  }

  async update(id: string, data: Partial<T>): Promise<boolean> {
    const item = (this.options.updateSchema ?? this.options.creationSchema)
      .parse(data) as T;
    const res = await this.options.collection.updateOne(this.#uniqueId(id), {
      $set: item,
    });
    return res.matchedCount === 1;
  }

  async replace(id: string, data: T): Promise<boolean> {
    const item = this.options.creationSchema.parse(
      data,
    ) as OptionalUnlessRequiredId<T>;
    const res = await this.options.collection.replaceOne(
      this.#uniqueId(id),
      item,
    );
    return res.matchedCount === 1;
  }

  async remove(id: string): Promise<boolean> {
    const res = await this.options.collection.deleteOne(this.#uniqueId(id));
    return res.deletedCount === 1;
  }

  #uniqueId(id: string): Filter<T> {
    if (this.options.uniqueFactory) {
      return this.options.uniqueFactory(id);
    }
    if (this.options.uniqueKey) {
      return { [this.options.uniqueKey]: id } as Filter<T>;
    }
    return { _id: new ObjectId(id) } as Filter<T>;
  }
}
