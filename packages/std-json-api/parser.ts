import qs, { type ParsedQs } from "qs";

/**
 * Sorting fields for JSON API query.
 *
 * The sort object maps field names to sort direction:
 * - 1 for ascending order
 * - -1 for descending order
 *
 * @example
 * ```json
 * {
 *   "name": 1,
 *   "createdAt": -1
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#fetching-sorting
 */
export type JsonApiQuerySorting = { [key: string]: -1 | 1 };

/**
 * Sparse fieldsets for JSON API query.
 *
 * Maps resource types to their requested fields. Each field is marked
 * with 1 to include it in the response. The JSON:API spec doesn't support
 * explicit exclusion (0), but this type allows it for implementation flexibility.
 *
 * @example
 * ```json
 * {
 *   "articles": {
 *     "title": 1,
 *     "body": 1
 *   },
 *   "people": {
 *     "name": 1
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#fetching-sparse-fieldsets
 */
export type JsonApiQueryFields = { [key: string]: { [key: string]: 0 | 1 } };

/**
 * Offset-based pagination parameters.
 *
 * @property offset - The number of records to skip
 * @property limit - The maximum number of records to return
 *
 * @example
 * ```
 * { offset: 20, limit: 10 }  // Skip 20, return next 10
 * ```
 *
 * @see https://jsonapi.org/format/#fetching-pagination
 */
export type OffsetPagination = { offset: number; limit: number };

/**
 * Cursor-based pagination parameters.
 *
 * @property cursor - An opaque cursor string identifying a position in the dataset
 * @property limit - The maximum number of records to return
 *
 * @example
 * ```
 * { cursor: "eyJpZCI6MTAwfQ==", limit: 10 }
 * ```
 *
 * @see https://jsonapi.org/format/#fetching-pagination
 */
export type CursorPagination = { cursor: string; field: string; limit: number };

/**
 * Filter parameters for JSON API query.
 *
 * The JSON:API specification reserves the `filter` query parameter family
 * but leaves the filtering strategy up to the server implementation.
 *
 * Note: All filter values are strings as they come from URL query parameters.
 * Server implementations should convert these to appropriate types (numbers,
 * booleans, dates) as needed.
 *
 * @example
 * ```json
 * {
 *   "status": "published",
 *   "author": "john",
 *   "age": "25",
 *   "created": {
 *     "gte": "2024-01-01"
 *   }
 * }
 * ```
 *
 * @see https://jsonapi.org/format/#fetching-filtering
 */
export type JsonApiQueryFilter = {
  [key: string]: string | string[] | JsonApiQueryFilter | JsonApiQueryFilter[];
};

/**
 * Complete JSON API query structure parsed from URL parameters.
 *
 * This type represents all the standard JSON:API query parameters,
 * plus any custom parameters via the index signature.
 *
 * @property sort - Field sorting specifications
 * @property page - Pagination parameters (offset or cursor based)
 * @property filter - Filtering criteria
 * @property fields - Sparse fieldsets for specific resource types
 * @property include - Related resources to include in the response
 *
 * @see https://jsonapi.org/format/#fetching
 */
export type JsonApiQuery = {
  sort: JsonApiQuerySorting;
  page?: OffsetPagination | CursorPagination;
  filter?: JsonApiQueryFilter;
  fields: JsonApiQueryFields;
  include?: string[];
  // Additional custom query parameters
  [key: string]: unknown;
};

/**
 * Parses a URL query string into a JSON:API query object.
 *
 * This function handles the standard JSON:API query parameters:
 * - `sort`: Comma-separated field names, prefix with `-` for descending order
 * - `page[offset]` and `page[limit]`: Offset-based pagination
 * - `page[cursor]` and `page[limit]`: Cursor-based pagination
 * - `filter[field]`: Filtering parameters (implementation-specific)
 * - `fields[type]`: Comma-separated field names for sparse fieldsets
 * - `include`: Comma-separated relationship paths
 *
 * @param searchString - The URL query string (without leading `?`)
 * @returns Parsed JSON:API query object
 *
 * @example
 * ```ts
 * const query = parser("sort=-created,title&page[offset]=20&page[limit]=10");
 * // Returns:
 * // {
 * //   sort: { created: -1, title: 1 },
 * //   page: { offset: 20, limit: 10 }
 * // }
 * ```
 *
 * @example
 * ```ts
 * const query = parser("filter[status]=published&include=author,comments");
 * // Returns:
 * // {
 * //   filter: { status: "published" },
 * //   include: ["author", "comments"]
 * // }
 * ```
 *
 * @see https://jsonapi.org/format/#fetching
 */
export function parser(searchString: string): JsonApiQuery {
  // Parse the query string using qs library
  const parsed = qs.parse(searchString, {
    depth: 10,
    parameterLimit: 1000,
    allowDots: false,
  }) as ParsedQs;

  const result: Partial<JsonApiQuery> = {};

  // Parse sort parameter
  // Format: sort=-created,title (descending created, ascending title)
  if (typeof parsed.sort === "string") {
    result.sort = parseSortParameter(parsed.sort);
  } else {
    result.sort = {};
  }

  // Parse page parameters
  // Supports both offset and cursor-based pagination
  if (parsed.page && typeof parsed.page === "object") {
    result.page = parsePageParameter(parsed.page as ParsedQs);
  }

  // Parse filter parameters
  // Format: filter[field]=value or nested structures
  if (parsed.filter && typeof parsed.filter === "object") {
    result.filter = parseFilterParameter(parsed.filter as ParsedQs);
  }

  // Parse fields parameters (sparse fieldsets)
  // Format: fields[articles]=title,body&fields[people]=name
  if (parsed.fields && typeof parsed.fields === "object") {
    result.fields = parseFieldsParameter(parsed.fields as ParsedQs);
  } else {
    result.fields = {};
  }

  // Parse include parameter
  // Format: include=author,comments.author (relationship paths)
  if (typeof parsed.include === "string") {
    result.include = parseIncludeParameter(parsed.include);
  }

  // Include any other custom query parameters
  for (const [key, value] of Object.entries(parsed)) {
    if (!["sort", "page", "filter", "fields", "include"].includes(key)) {
      result[key] = value;
    }
  }

  return result as JsonApiQuery;
}

/**
 * Parses the sort parameter from a comma-separated string.
 *
 * @param sortString - Comma-separated field names with optional `-` prefix for descending
 * @returns Sort object mapping field names to directions (1 or -1)
 *
 * @example
 * ```ts
 * parseSortParameter("-created,title")
 * // Returns: { created: -1, title: 1 }
 * ```
 *
 * @internal
 */
function parseSortParameter(sortString: string): JsonApiQuerySorting {
  const sorting: JsonApiQuerySorting = {};

  // Split by comma and process each field
  const fields = sortString.split(",").map((s) => s.trim()).filter(Boolean);

  for (const field of fields) {
    if (field.startsWith("-")) {
      // Descending order
      sorting[field.substring(1)] = -1;
    } else {
      // Ascending order
      sorting[field] = 1;
    }
  }

  return sorting;
}

/**
 * Validates that a parsed integer is safe and within acceptable bounds.
 *
 * @param value - The parsed integer value
 * @returns true if the value is safe and valid
 *
 * @internal
 */
function isSafeInteger(value: number): boolean {
  return !isNaN(value) && Number.isSafeInteger(value);
}

/**
 * Parses page parameters (offset or cursor based).
 *
 * @param pageObj - Parsed page object from query string
 * @returns Pagination object (OffsetPagination or CursorPagination)
 *
 * @example
 * ```ts
 * parsePageParameter({ offset: "20", limit: "10" })
 * // Returns: { offset: 20, limit: 10 }
 * ```
 *
 * @internal
 */
function parsePageParameter(
  pageObj: ParsedQs,
): OffsetPagination | CursorPagination | undefined {
  // Check for cursor-based pagination
  if ("cursor" in pageObj && typeof pageObj.cursor === "string") {
    const cursor = pageObj.cursor;
    const field = typeof pageObj.field === "string" ? pageObj.field : "id"; // Default field for cursor pagination
    const limit = typeof pageObj.limit === "string"
      ? parseInt(pageObj.limit, 10)
      : 10; // Default limit

    // Validate limit: must be a safe positive integer
    if (isSafeInteger(limit) && limit > 0) {
      return { cursor, field, limit } as CursorPagination;
    }
    return undefined;
  }

  // Check for offset-based pagination
  if ("offset" in pageObj || "limit" in pageObj) {
    const offset = typeof pageObj.offset === "string"
      ? parseInt(pageObj.offset, 10)
      : 0;
    const limit = typeof pageObj.limit === "string"
      ? parseInt(pageObj.limit, 10)
      : 10;

    // Validate: offset must be non-negative, limit must be positive, both must be safe integers
    if (isSafeInteger(offset) && isSafeInteger(limit) && offset >= 0 && limit > 0) {
      return { offset, limit } as OffsetPagination;
    }
    return undefined;
  }

  return undefined;
}

/**
 * Parses filter parameters into a structured object.
 *
 * @param filterObj - Parsed filter object from query string
 * @returns Filter object with field-value pairs
 *
 * @example
 * ```ts
 * parseFilterParameter({ status: "published", author: "john" })
 * // Returns: { status: "published", author: "john" }
 * ```
 *
 * @internal
 */
function parseFilterParameter(filterObj: ParsedQs): JsonApiQueryFilter {
  // todo currently it works as expected, but we may want to implement type conversions in the dapter layer
  // for (const [key, value] of Object.entries(filterObj)) {
  //     if (typeof value === "string") {
  //         // ParsedQs values are always strings when primitive
  //         filter[key] = value;
  //     } else if (Array.isArray(value)) {
  //         // Handle arrays - filter only string values as ParsedQs contains only strings
  //         filter[key] = value.map(v => parseFilterParameter(v));
  //     } else if (value && typeof value === "object") {
  //         // Recursively handle nested ParsedQs objects
  //         filter[key] = parseFilterParameter(value);
  //     }
  // }
  //
  // return filter;
  return filterObj as JsonApiQueryFilter;
}

/**
 * Parses fields parameters for sparse fieldsets.
 *
 * @param fieldsObj - Parsed fields object from query string
 * @returns Fields object mapping resource types to field selections
 *
 * @example
 * ```ts
 * parseFieldsParameter({ articles: "title,body", people: "name" })
 * // Returns: { articles: { title: 1, body: 1 }, people: { name: 1 } }
 * ```
 *
 * @internal
 */
function parseFieldsParameter(fieldsObj: ParsedQs): JsonApiQueryFields {
  const fields: JsonApiQueryFields = {};

  for (const [resourceType, fieldList] of Object.entries(fieldsObj)) {
    if (typeof fieldList === "string") {
      // Split comma-separated fields and mark each as included (1)
      const fieldNames = fieldList.split(",").map((f) => f.trim()).filter(
        Boolean,
      );
      fields[resourceType] = {};

      for (const fieldName of fieldNames) {
        fields[resourceType][fieldName] = 1;
      }
    }
  }

  return fields;
}

/**
 * Parses the include parameter for relationship paths.
 *
 * @param includeString - Comma-separated relationship paths
 * @returns Array of relationship paths
 *
 * @example
 * ```ts
 * parseIncludeParameter("author,comments.author")
 * // Returns: ["author", "comments.author"]
 * ```
 *
 * @internal
 */
function parseIncludeParameter(includeString: string): string[] {
  return includeString
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);
}

/**
 * Serializes a JSON:API query object into a URL query string.
 *
 * This function is the inverse of `parser` and handles the standard JSON:API query parameters:
 * - `sort`: Converted to comma-separated field names, `-` prefix for descending order
 * - `page.offset` and `page.limit`: Converted to `page[offset]` and `page[limit]`
 * - `page.cursor`, `page.field` and `page.limit`: Converted to cursor-based pagination params
 * - `filter`: Converted to `filter[field]` format (supports nested structures)
 * - `fields`: Converted to `fields[type]=field1,field2` format
 * - `include`: Converted to comma-separated relationship paths
 *
 * @param query - The JSON:API query object to serialize
 * @returns URL query string (without leading `?`)
 *
 * @example
 * ```ts
 * const queryString = serializer({
 *   sort: { created: -1, title: 1 },
 *   page: { offset: 20, limit: 10 }
 * });
 * // Returns: "sort=-created,title&page[offset]=20&page[limit]=10"
 * ```
 *
 * @example
 * ```ts
 * const queryString = serializer({
 *   filter: { status: "published" },
 *   include: ["author", "comments"]
 * });
 * // Returns: "filter[status]=published&include=author,comments"
 * ```
 *
 * @see https://jsonapi.org/format/#fetching
 */
export function serializer(query: JsonApiQuery): string {
  const obj: Record<string, unknown> = {};

  // Serialize sort parameter
  if (query.sort && Object.keys(query.sort).length > 0) {
    obj.sort = serializeSortParameter(query.sort);
  }

  // Serialize page parameters
  if (query.page) {
    obj.page = serializePageParameter(query.page);
  }

  // Serialize filter parameters (pass through as-is, qs handles nested objects)
  if (query.filter && Object.keys(query.filter).length > 0) {
    obj.filter = query.filter;
  }

  // Serialize fields parameters
  if (query.fields && Object.keys(query.fields).length > 0) {
    obj.fields = serializeFieldsParameter(query.fields);
  }

  // Serialize include parameter
  if (query.include && query.include.length > 0) {
    obj.include = query.include.join(",");
  }

  // Pass through custom query parameters
  for (const [key, value] of Object.entries(query)) {
    if (!["sort", "page", "filter", "fields", "include"].includes(key)) {
      obj[key] = value;
    }
  }

  return qs.stringify(obj, { allowDots: false });
}

/**
 * Converts sort object to comma-separated string format.
 *
 * @param sort - Sort object mapping field names to directions (1 or -1)
 * @returns Comma-separated field names with optional `-` prefix for descending
 *
 * @internal
 */
function serializeSortParameter(sort: JsonApiQuerySorting): string {
  return Object.entries(sort)
    .map(([field, direction]) => direction === -1 ? `-${field}` : field)
    .join(",");
}

/**
 * Converts page object to qs-compatible structure.
 *
 * @param page - Pagination object (OffsetPagination or CursorPagination)
 * @returns Object suitable for qs.stringify
 *
 * @internal
 */
function serializePageParameter(
  page: OffsetPagination | CursorPagination,
): Record<string, string | number> {
  if ("cursor" in page) {
    const result: Record<string, string | number> = {
      cursor: page.cursor,
      limit: page.limit,
    };
    if (page.field && page.field !== "id") {
      result.field = page.field;
    }
    return result;
  }

  return {
    offset: page.offset,
    limit: page.limit,
  };
}

/**
 * Converts fields object to qs-compatible structure with comma-separated values.
 *
 * @param fields - Fields object mapping resource types to field selections
 * @returns Object with resource types as keys and comma-separated field names as values
 *
 * @internal
 */
function serializeFieldsParameter(
  fields: JsonApiQueryFields,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [resourceType, fieldMap] of Object.entries(fields)) {
    const includedFields = Object.entries(fieldMap)
      .filter(([, included]) => included === 1)
      .map(([fieldName]) => fieldName);

    if (includedFields.length > 0) {
      result[resourceType] = includedFields.join(",");
    }
  }

  return result;
}
