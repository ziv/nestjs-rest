import qs from "qs";
import type {
  RestAdapterFilter,
  RestAdapterPagination,
  RestAdapterSorting,
} from "./json-api-query";
import { link } from "./json-api";
import type { Link, Links, PaginationLinks } from "./json-api-types";

export type LinkerOptions = {
  baseUrl: string;
  resource: string;
  total: number;
  page: RestAdapterPagination;
  sort: RestAdapterSorting[];
  filter: RestAdapterFilter;
};

export default class JsonApiLinker {
  get paginationAndSelf(): PaginationLinks & Links {
    return {
      first: this.first,
      last: this.last,
      prev: this.prev,
      next: this.next,
      self: this.self(),
    };
  }

  self(id?: string) {
    if (id) {
      return link(`${this.options.baseUrl}/${this.options.resource}/${id}`);
    }
    return this.#builder();
  }

  constructor(readonly options: LinkerOptions) {
  }

  get prev(): undefined | Link {
    if (this.#page.offset < 0) {
      return undefined;
    }
    if (this.#page.offset - this.#page.limit < 0) {
      return this.first;
    }
    return this.#builder({
      offset: this.#page.offset - this.#page.limit,
      limit: this.#page.limit,
    });
  }

  get next(): undefined | Link {
    if (this.#page.offset + this.#page.limit >= this.options.total) {
      return undefined;
    }
    return this.#builder({
      offset: this.#page.offset + this.#page.limit,
      limit: this.#page.limit,
    });
  }

  get first(): undefined | Link {
    return this.#builder({ offset: 0, limit: this.#page.limit });
  }

  // get self(): Link {
  //     return this.#builder();
  // }

  get last(): undefined | Link {
    const lastOffset = Math.floor((this.options.total - 1) / this.#page.limit) *
      this.#page.limit;
    if (lastOffset < 0) {
      return undefined;
    }
    return this.#builder({ offset: lastOffset, limit: this.#page.limit });
  }

  get #page() {
    return this.options.page as unknown as RestAdapterPagination;
  }

  #builder(page?: RestAdapterPagination) {
    const params: { [key: string]: unknown } = {};

    if (this.options.page) {
      params["page"] = {
        offset: this.#page.offset,
        limit: this.#page.limit,
      };
    }

    if (page) {
      params["page"] = {
        offset: page.offset,
        limit: page.limit,
      };
    }

    if (this.options.sort) {
      params["sort"] = this.options.sort.map((item) =>
        item.dir === "desc" ? `-${item.field}` : item.field
      ).join(",");
    }

    if (this.options.filter) {
      params["filter"] = this.options.filter;
    }

    return link(
      `${this.options.baseUrl}/${this.options.resource}?${
        qs.stringify(params)
      }`,
    );
  }
}
