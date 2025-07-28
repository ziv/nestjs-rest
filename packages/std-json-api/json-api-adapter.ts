// import { RestModel } from "nestjs-rest";
// import { jsonApi, resource } from "./json-api";
// import {
//   AttributesObject,
//   CollectionResourceDocument,
//   Links,
//   Meta,
//   PaginationLinks,
// } from "./json-api-types";
// import { filtering, pagination, parse, sorting } from "./json-api-query";
// import JsonApiLinker, { LinkerOptions } from "./json-api-linker";
// import JsonApiCrudAdapter from "./json-api-crud-adapter";
//
// export type JsonApiAdapterOptions<
//   T extends AttributesObject = AttributesObject,
// > = {
//   baseUrl: string;
//   pageSize?: number;
//
//   idKey?: string; // Optional, defaults to "id"
//   idFn?: (item: T) => string; // Optional, defaults to item[idKey]
// };
//
// export default class JsonApiAdapter<
//   Model extends AttributesObject = AttributesObject,
// > {
//   constructor(
//     readonly adapter: JsonApiCrudAdapter<Model>,
//     readonly options: JsonApiAdapterOptions,
//   ) {
//   }
//
//   async multiple<R extends AttributesObject = Model>(
//     queryParams: string,
//   ): Promise<CollectionResourceDocument<R>> {
//     const type = this.adapter.resource();
//
//     // parse query string into a nested object (extended version of `application/x-www-form-urlencoded`)2
//     const { sort: sortString, page: pageObject, filter: filterObject } = parse(
//       queryParams,
//     );
//     // console.log({sortString, pageObject, filterObject});
//
//     // extract items from parsed query
//     const sort = sorting(sortString);
//     const page = pagination(pageObject);
//     const filter = filtering(filterObject);
//     // console.log({sort, page, filter});
//
//     // reading data from the client
//     const { data, total } = await this.adapter.multiple(filter, sort, page);
//
//     // console.log({data, total});
//     const linker = new JsonApiLinker({
//       baseUrl: this.options.baseUrl,
//       resource: type,
//       total,
//       page,
//       sort,
//       filter,
//     } as LinkerOptions);
//
//     const meta: Meta = {
//       total,
//       offset: page.offset,
//       limit: page.limit,
//     };
//
//     const links: PaginationLinks & Links = {
//       first: linker.first,
//       last: linker.last,
//       prev: linker.prev,
//       next: linker.next,
//       self: linker.self(),
//     };
//
//     const collection = data.map((item) =>
//       resource(this.#id(item), type).attributes(item).links({
//         self: linker.self(this.#id(item)),
//       }).build()
//     );
//
//     return jsonApi().dataCollection(collection).links(links).meta(meta)
//       .build() as CollectionResourceDocument<R>;
//   }
//
//   create(data: RestModel): Promise<string> {
//     throw new Error("Method not implemented.");
//   }
//
//   replace(id: string, data: RestModel): Promise<boolean> {
//     throw new Error("Method not implemented.");
//   }
//
//   update(id: string, data: Partial<RestModel>): Promise<boolean> {
//     throw new Error("Method not implemented.");
//   }
//
//   remove(id: string): Promise<boolean> {
//     throw new Error("Method not implemented.");
//   }
//
//   #id(item: Model) {
//     if (this.options.idKey) {
//       return item[this.options.idKey];
//     }
//     if (this.options.idFn) {
//       return this.options.idFn(item);
//     }
//     if ("id" in item) {
//       return item.id;
//     }
//     throw new Error(`Unable to determine ID for item: ${JSON.stringify(item)}`);
//   }
// }
