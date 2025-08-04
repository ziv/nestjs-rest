import qs, {type ParsedQs} from "qs";

export type JsonApiQuerySorting = { [key: string]: -1 | 1 };
export type JsonApiQueryFields = { [key: string]: { [key: string]: 0 | 1 } };
export type OffsetPagination = { offset: number; limit: number }; // default pagination type

export type JsonApiQuery<Pagination = OffsetPagination> = {
    sort: JsonApiQuerySorting;
    page: Pagination;
    filter: object;
    fields: JsonApiQueryFields; // fields to include in the response
    include: string[]; // related resources to include
    [key: string]: unknown;
};

export type RestAdapterFilter = ParsedQs;

export type RestAdapterPagination = { offset: number; limit: number };

function splitter(str: string) {
    return str.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Input:
 * ```
 * fields[resource]=field1,field2,...,!field3
 * ```
 * Output:
 * ```json
 * {
 *  "<resource id>": {
 *    "field1": 1,
 *    "field2": 1,
 *    "field3": 0
 *   }
 * }
 * ```
 * @param fields
 */
function parsed2fields(fields?: unknown): JsonApiQueryFields {
    if (!fields) {
        return {};
    }
    if (typeof fields === "string") {
        fields = qs.parse(fields);
    }
    if (typeof fields !== "object") {
        return {};
    }
    const ret: JsonApiQueryFields = {};
    for (const [resource, val] of Object.entries(fields as object)) {
        if (!ret[resource]) {
            ret[resource] = {};
        }
        if (typeof val !== "string") {
            console.warn("Invalid fields format, expected string, got", val);
            continue; // unable to parse, skip
        }

        for (const field of splitter(val)) {
            if (field.startsWith("!")) {
                ret[resource][field.slice(1)] = 0; // remove ! from the field name and exclude it
            } else {
                ret[resource][field] = 1; // include field
            }
        }
    }
    return ret;
}

/**
 * Input:
 * ```
 * page[offset]=10&page[limit]=20
 * ```
 * Output:
 * ```json
 * {
 *  "offset": 10,
 *  "limit": 20
 *  }
 * ```
 * @param page
 */
function parsed2pagination(page: unknown): RestAdapterPagination {
    if (typeof page === "string") {
        page = qs.parse(page);
    }
    if (
        typeof page === "object" && page !== null && "offset" in page &&
        "limit" in page
    ) {
        const offset = parseInt(String(page.offset), 10);
        const limit = parseInt(String(page.limit), 10);

        if (isNaN(offset) || isNaN(limit)) {
            console.warn("Invalid pagination parameters, using defaults");
            return {offset: 0, limit: 20};
        }
        return {offset, limit};
    }

    return {offset: 0, limit: 20};
}

/**
 * Input:
 * ```
 * sort=field1,-field2
 * ```
 * Output:
 * ```json
 * {
 *   "field1": 1,
 *   "field2": -1
 * }
 * ```
 * @param sortString
 */
function parsed2sorting(
    sortString: unknown,
): JsonApiQuerySorting {
    let res: JsonApiQuerySorting = {};
    if (!sortString || typeof sortString !== "string") {
        return res;
    }

    return splitter(sortString).reduce((acc, cur) => {
        const dir = cur.startsWith("-") ? -1 : 1;
        const field = dir === -1 ? cur.slice(1) : cur;
        acc[field] = dir;
        return acc;
    }, res);
}

function parsed2filter(
    filter: unknown,
): RestAdapterFilter {
    if (typeof filter === "string") {
        return qs.parse(filter);
    }
    if (typeof filter === "object" && filter !== null) {
        return filter as RestAdapterFilter;
    }
    return {};
}

/**
 * Input:
 * ```
 * include=related1,related2.related3
 * ```
 * Output:
 * ```json
 * [
 *  "related1",
 *  "related2.related3"
 * ]
 * ```
 * @param include
 */
function parsed2include(include: unknown): string[] {
    if (typeof include !== "string") {
        return [];
    }
    return splitter(include);
}

export default function queryStringParser(searchString: string): JsonApiQuery {
    /**
     * JSON:API query string is a bit more complex than just `application/x-www-form-urlencoded` ("extended" version in express terms).
     * We use `qs` package to parse the query string into a nested object.
     *
     * @see https://jsonapi.org/format/#appendix-query-details
     */
    const parsed = qs.parse(searchString);
    return {
        ...parsed,
        sort: parsed2sorting(parsed.sort),
        filter: parsed2filter(parsed.filter),
        page: parsed2pagination(parsed.page),
        fields: parsed2fields(parsed.fields),
        include: parsed2include(parsed.include),
    } as JsonApiQuery;
}

