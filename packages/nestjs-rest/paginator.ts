import qs from "qs";

export class PaginationState {
}

export class CollectionPaginationState extends PaginationState {
  constructor(
    readonly url: string,
    readonly parsed: object,
    readonly limit: number,
    readonly offset: number,
    readonly total: number,
  ) {
    super();
  }

  first(): string {
    return this.#build({ limit: this.limit, offset: 0 });
  }

  last(): string | undefined {
    const lastOffset = Math.floor((this.total - 1) / this.limit) * this.limit;
    return (lastOffset >= 0)
      ? this.#build({ limit: this.limit, offset: lastOffset })
      : undefined;
  }

  next(): string | undefined {
    const nextOffset = this.offset + this.limit;
    return (this.total >= nextOffset)
      ? this.#build({ limit: this.limit, offset: nextOffset })
      : undefined;
  }

  previous(): string | undefined {
    const prevOffset = this.offset - this.limit;
    return (prevOffset >= 0)
      ? this.#build({ limit: this.limit, offset: prevOffset })
      : undefined;
  }

  self(): string {
    return this.#build({ limit: this.limit, offset: this.offset });
  }

  #build(page: { limit: number; offset: number }) {
    return `${this.url}?${qs.stringify({ ...this.parsed, page })}`;
  }
}

export class ResourcePaginationState extends PaginationState {
  constructor(
    readonly url: string,
    readonly parsed: object,
    readonly id: string,
  ) {
    super();
  }

  self(): string {
    return `${this.url}/${this.id}`;
  }

  #build() {
    return `${this.url}?${qs.stringify({ ...this.parsed })}`;
  }
}

export type JsonApiPaginatorCreateCollectionOptions = {
  baseUrl: string;
  resource: string;
  parsed: object;

  limit: number;
  offset: number;
  total: number;
};

export type JsonApiPaginatorCreateResourceOptions = {
  baseUrl: string;
  resource: string;
  parsed: object;

  id: string;
};

export default class JsonApiPaginator {
  static collection(options: JsonApiPaginatorCreateCollectionOptions) {
    return new CollectionPaginationState(
      `${options.baseUrl}/${options.resource}`,
      options.parsed,
      options.limit,
      options.offset,
      options.total,
    );
  }

  static resource(options: JsonApiPaginatorCreateResourceOptions) {
    return new ResourcePaginationState(
      `${options.baseUrl}/${options.resource}`,
      options.parsed,
      options.id,
    );
  }
}
