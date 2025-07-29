import type {
  AttributesObject,
  CollectionResourceDocument,
  JsonApiDocument,
  Links,
  Meta,
  PaginationLinks,
  ResourceObject,
  SingleResourceDocument,
} from "./json-api-types";

export type Doc = Partial<JsonApiDocument>;
export type Res = Partial<ResourceObject>;
export type UpdateFn<U> = (doc: U) => U;

export function meta(m: Meta): UpdateFn<Doc> {
  return (doc: Doc) => {
    doc.meta = m;
    return doc;
  };
}

export function links(l: Links & PaginationLinks): UpdateFn<Doc | Res> {
  return (doc: Doc | Res) => {
    doc.links = l;
    return doc;
  };
}

export function typed(type: string): UpdateFn<Res> {
  return (res: Res) => {
    res.type = type;
    return res;
  };
}

export function identifier(id: string, type: string): UpdateFn<Res> {
  return (res: Res) => {
    res.id = id;
    res.type = type;
    return res;
  };
}

export function attributes(attrs: any): UpdateFn<Res> {
  return (res: Res) => {
    res.attributes = attrs;
    return res;
  };
}

export function dataCollection<T extends AttributesObject = AttributesObject>(
  resources: ResourceObject<T>[],
): UpdateFn<Doc> {
  return (doc: Doc) => {
    (doc as CollectionResourceDocument).data = resources;
    return doc;
  };
}

export function dataResource<T extends AttributesObject = AttributesObject>(
  resource: ResourceObject<T>,
): UpdateFn<Doc> {
  return (doc: Doc) => {
    (doc as SingleResourceDocument).data = resource;
    return doc;
  };
}

// root elements

export function resource<T extends AttributesObject>(...fns: UpdateFn<Res>[]) {
  let res: Res = {};
  for (const fn of fns) {
    res = fn(res);
  }
  return res as ResourceObject<T>;
}

export function jsonApi<T>(...fns: UpdateFn<Doc>[]) {
  let doc: Doc = { jsonapi: { version: "1.0" } };
  for (const fn of fns) {
    doc = fn(doc);
  }
  return doc as T;
}

export function collectionDocument<T extends AttributesObject>(
  ...fns: UpdateFn<Doc>[]
) {
  return jsonApi<CollectionResourceDocument<T>>(...fns);
}

export function resourceDocument<T extends AttributesObject>(
  ...fns: UpdateFn<Res>[]
) {
  return jsonApi<SingleResourceDocument<T>>(...fns);
}
