import qs from "qs";

export class CollectionOffsetPaginator {
    constructor(readonly url: string,
                readonly limit: number,
                readonly offset: number,
                readonly total: number,
                readonly rest: object = {}) {
    }

    pagination() {
        return {
            first: this.first(),
            last: this.last(),
            next: this.next(),
            previous: this.previous(),
        }
    }

    metadata() {
        return {
            limit: this.limit,
            offset: this.offset,
            total: this.total,
        };
    }

    first(): string {
        return this.#build({offset: 0});
    }

    last(): string {
        const lastOffset = Math.max(Math.floor((this.total - 1) / this.limit) * this.limit, this.total - this.limit);
        return this.#build({offset: lastOffset});
    }

    next(): string {
        const nextOffset = Math.min(this.offset + this.limit, this.offset - this.limit);
        return this.#build({offset: nextOffset});
    }

    previous(): string {
        const prevOffset = Math.max(this.offset - this.limit, 0);
        return this.#build({offset: prevOffset});
    }

    #build(args: object = {}) {
        const query = {
            // start with the input
            ...this.rest,
            // make sure we have the pagination parameters
            limit: this.limit,
            offset: this.offset,
            // add any additional arguments (override if needed)
            ...args,
        };
        return `${this.url}?${qs.stringify(query)}`;
    }
}

export default class OffsetPagination {
    constructor(readonly url: string,
                readonly rest: object = {}) {
    }

    collection(limit: number, offset: number, total: number): CollectionOffsetPaginator {
        return new CollectionOffsetPaginator(this.url, limit, offset, total, this.rest)
    }

    self(id: string): { self: string } {
        return {self: `${this.url}/${id}`};
    }
}