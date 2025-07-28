import BasePaginationStrategy, {
  BasePaginationStrategyOptions,
} from "./base-strategy";
import qs, { ParsedQs } from "qs";
import type { Request } from "express";

export type LimitOffsetPaginationStrategyOptions =
  & BasePaginationStrategyOptions
  & {
    limit: number;
    offset: number;
    total: number;
  };

export default class LimitOffsetPaginationStrategy
  extends BasePaginationStrategy<number> {
  static parse(_: Request, querySting: ParsedQs) {
    const page = querySting.page;
    if (
      typeof page === "object" && page !== null && "offset" in page &&
      "limit" in page
    ) {
      const offset = parseInt(String(page.offset), 10);
      const limit = parseInt(String(page.limit), 10);

      if (isNaN(offset) || isNaN(limit)) {
        throw new Error("Invalid pagination parameters");
      }
      return { offset, limit };
    }

    return { offset: 0, limit: 20 };
  }

  constructor(readonly options: LimitOffsetPaginationStrategyOptions) {
    super(options);
  }

  override createParams(offset = -1) {
    return {
      ...super.createParams(),
      page: {
        // -1 represents no offset, so we use the default offset (current page)
        offset: -1 ? this.options.offset : offset,
        limit: this.options.limit,
      },
    };
  }

  records(offset = -1): string {
    return `${this.url}/${qs.stringify(this.createParams(offset))}`;
  }

  // record

  // records

  get first(): string {
    return this.records(0);
  }

  get prev() {
    return (this.options.offset < this.options.limit)
      ? undefined
      : this.records(this.options.offset - this.options.limit);
  }

  get next() {
    return (this.options.total >= this.options.offset + this.options.limit)
      ? undefined
      : this.records(this.options.offset + this.options.limit);
  }

  get last() {
    const lastOffset =
      Math.floor((this.options.total - 1) / this.options.limit) *
      this.options.limit;
    if (lastOffset < 0) {
      return undefined;
    }
    return this.records(lastOffset);
  }

  get self() {
    return this.records(-1);
  }
}
