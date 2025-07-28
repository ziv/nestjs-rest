import {RestAdapterFilter, RestAdapterPagination, RestAdapterSorting} from "std-json-api/json-api-query";
import {AttributesObject, CollectionResourceDocument, SingleResourceDocument} from "std-json-api/json-api-types";

export type MultipleArgs<Pagination = RestAdapterPagination> = {
    filter: RestAdapterFilter;
    sort: RestAdapterSorting[];
    page: Pagination; // todo make generic
};

export default interface JsonApiAdapter<
    Model extends AttributesObject = AttributesObject,
> {
    multiple<R extends Model = Model>(input: MultipleArgs): Promise<CollectionResourceDocument<R>>;

    single<R extends Model = Model>(
        id: string,
    ): Promise<SingleResourceDocument<R>>;

    create<R = Model>(data: R): Promise<string>;

    update<R = Model>(id: string, data: Partial<R>): Promise<string>;

    remove(id: string): Promise<string>;
}
