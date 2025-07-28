import { RestAdapterFilter, RestAdapterSorting } from "../json-api-query";
import qs, { ParsedQs } from "qs";
import type { Request } from "express";

export type BasePaginationStrategyOptions = {
  // base URL for the API
  resource: string;
  url: string;

  // for reflective pagination
  sort: RestAdapterSorting[];
  filter: RestAdapterFilter;
};

export default abstract class BasePaginationStrategy<Pages, Page = string> {
  get url() {
    return `${this.options.url}/${this.options.resource}`;
  }

  protected constructor(readonly options: BasePaginationStrategyOptions) {
  }

  record(id: Page): string {
    return `${this.url}/${id}`;
  }

  records(ctx: Pages) {
    return `${this.url}/${qs.stringify(this.createParams(ctx))}`;
  }

  // override this to get the parameters for your pagination strategy
  createParams(_?: Pages) {
    return {
      // revert to string sort format (original)
      sort: (this.options.sort ?? []).map((i) =>
        i.dir === "desc" ? `-${i.field}` : i.field
      ).join(","),
      filter: this.options.filter,
    };
  }
}
