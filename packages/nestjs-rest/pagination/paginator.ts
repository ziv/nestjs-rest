// import qs from "qs";
// import type {JsonApiQuery} from "std-json-api/query-string-parser";
//
// export class PaginationState {
// }
//
// export class CollectionPaginationState extends PaginationState {
//     constructor(
//         readonly parsed: JsonApiQuery & { baseUrl: string; total: number; },
//     ) {
//         super();
//     }
//
//     links() {
//         return {
//             self: this.self(),
//             first: this.first(),
//             last: this.last(),
//             next: this.next(),
//             prev: this.previous(),
//         }
//     }
//
//     metadata() {
//         return {
//             total: this.parsed.total,
//             limit: this.parsed.page.limit,
//             offset: this.parsed.page.offset,
//         }
//     }
//
//     first(): string {
//         return this.#build({limit: this.parsed.page.limit, offset: 0});
//     }
//
//     last(): string | undefined {
//         const lastOffset = Math.floor((this.parsed.total - 1) / this.parsed.page.limit) * this.parsed.page.limit;
//         return (lastOffset >= 0)
//             ? this.#build({limit: this.parsed.page.limit, offset: lastOffset})
//             : undefined;
//     }
//
//     next(): string | undefined {
//         const nextOffset = this.parsed.page.offset + this.parsed.page.limit;
//         return (this.parsed.total >= nextOffset)
//             ? this.#build({limit: this.parsed.page.limit, offset: nextOffset})
//             : undefined;
//     }
//
//     previous(): string | undefined {
//         const prevOffset = this.parsed.page.offset - this.parsed.page.limit;
//         return (prevOffset >= 0)
//             ? this.#build({limit: this.parsed.page.limit, offset: prevOffset})
//             : undefined;
//     }
//
//     self(): string {
//         return this.#build({limit: this.parsed.page.limit, offset: this.parsed.page.offset});
//     }
//
//     #build(page: { limit: number; offset: number }) {
//         return `${this.parsed.baseUrl}?${qs.stringify({...this.parsed, page})}`;
//     }
// }
//
// export class ResourcePaginationState extends PaginationState {
//     constructor(
//         readonly url: string,
//         readonly parsed: object,
//         readonly id: string,
//     ) {
//         super();
//     }
//
//     self(): string {
//         return `${this.url}/${this.id}`;
//     }
//
//     #build() {
//         return `${this.url}?${qs.stringify({...this.parsed})}`;
//     }
// }
//
// export type JsonApiPaginatorCreateCollectionOptions = {
//     baseUrl: string;
//     resource: string;
//     parsed: { limit: number; offset: number; total: number; };
//
//     // limit: number;
//     // offset: number;
//     // total: number;
// };
//
// export type JsonApiPaginatorCreateResourceOptions = {
//     baseUrl: string;
//     resource: string;
//     parsed: object;
//
//     id: string;
// };
//
// export default class JsonApiPaginator {
//     // static collection(options: JsonApiPaginatorCreateCollectionOptions) {
//     //     return new CollectionPaginationState(
//     //         `${options.baseUrl}/${options.resource}`,
//     //         options.parsed,
//     //     );
//     // }
//
//     static resource(options: JsonApiPaginatorCreateResourceOptions) {
//         return new ResourcePaginationState(
//             `${options.baseUrl}/${options.resource}`,
//             options.parsed,
//             options.id,
//         );
//     }
// }
