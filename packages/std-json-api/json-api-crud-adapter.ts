import type {
  AttributesObject,
  Meta,
  SingleResourceDocument,
} from "./json-api-types";
import type {
  RestAdapterFilter,
  RestAdapterPagination,
  RestAdapterSorting,
} from "./json-api-query";

export type MultipleArgs<Pagination = RestAdapterPagination> = {
  filter: RestAdapterFilter;
  sort: RestAdapterSorting[];
  page: Pagination; // todo make generic
};

export default interface JsonApiCrudAdapter<
  Model extends AttributesObject = AttributesObject,
> {
  // options

  resource(): string;

  baseUrl(): string;

  emptyResponse(): boolean;

  id(e: Model): string;

  // crud

  multiple<R = Model>(input: MultipleArgs): Promise<{ data: R[]; meta: Meta }>;

  single<R extends Model = Model>(
    id: string,
  ): Promise<SingleResourceDocument<R>>;

  create<R = Model>(data: R): Promise<string>;

  update<R = Model>(id: string, data: Partial<R>): Promise<string>;

  remove(id: string): Promise<string>;
}
