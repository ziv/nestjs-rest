import {
    AttributesObject,
    CollectionResourceDocument,
    JsonApiDocument,
    JsonApiDocumentBase,
    Links as LinksObject,
    Meta as MetaObject,
    PaginationLinks,
    ResourceObject,
    SingleResourceDocument,
} from "./json-api-types";

/** Functional API for JSON:API documents and resources */

export type Doc = Partial<JsonApiDocument>;
export type Res = Partial<ResourceObject>;
export type ResDoc = Res | Doc;
export type UpdateFn<U> = (doc: U) => U;

function createUpdateFn<Input, Context>(key: string) {
    return (input: Input): UpdateFn<Context> => {
        return (doc: Context) => {
            const k = key as keyof Context;
            doc[k] = input as Context[keyof Context];
            return doc;
        }
    }
}

function createPipeFn<Context>(isRoot = false) {
    return <T>(...fns: UpdateFn<any>[]) => {
        let doc: ResDoc = isRoot ? {jsonapi: {version: "1.0"}} : {};
        for (const fn of fns) {
            doc = fn(doc as Context);
        }
        return doc as T;
    }
}

// Doc
export const Data = createUpdateFn<object | object[], Doc>('data');

// ResDoc
export const Meta = createUpdateFn<MetaObject, ResDoc>('meta')
export const Links = createUpdateFn<LinksObject & PaginationLinks, ResDoc>('links');

// Res
export const Type = createUpdateFn<string, Res>('type');
export const Id = createUpdateFn<string, Res>('id');
export const Attributes = createUpdateFn<object, Res>('attributes');

// root elements

export const Resource = createPipeFn<ResourceObject>();
export const SingleDocument = createPipeFn<SingleResourceDocument>(true);
export const CollectionDocument = createPipeFn<CollectionResourceDocument>(true);

/** Builder API for JSON:API documents and resources */

export class JsonApiBaseBuilder<T extends JsonApiDocumentBase = JsonApiDocumentBase> {
    protected readonly resource: T = {} as T;

    build(): T {
        return this.resource as T;
    }

    as<R>(): R {
        return this.resource as unknown as R;
    }

    metadata(m: MetaObject): this {
        Meta(m)(this.resource);
        return this;
    }

    links(l: LinksObject & PaginationLinks): this {
        Links(l)(this.resource);
        return this;
    }
}

export class JsonApiResourceBuilder<T extends AttributesObject> extends JsonApiBaseBuilder<ResourceObject<T>> {

    type(type: string): this {
        Type(type)(this.resource);
        return this;
    }

    id(id: string): this {
        Id(id)(this.resource);
        return this;
    }

    attributes(attrs: object): this {
        Attributes(attrs)(this.resource);
        return this;
    }
}

export class JsonApiSingleDocumentBuilder<T extends AttributesObject> extends JsonApiBaseBuilder<T> {
    data(resources: ResourceObject) {
        Data(resources)(this.resource);
        return this;
    }
}

export class JsonApiCollectionDocumentBuilder<T extends JsonApiDocumentBase> extends JsonApiBaseBuilder<T> {
    data(resources: ResourceObject[]) {
        Data(resources)(this.resource);
        return this;
    }
}

export class JsonApiBuilder {
    /**
     * Create a new resource builder with the given ID and type.
     *
     * @param id
     * @param type
     */
    static resource<T extends AttributesObject>(id: string, type: string) {
        const builder = new JsonApiResourceBuilder<T>();
        builder.id(id);
        builder.type(type);
        return builder;
    }

    /**
     * Create a new single document builder.
     */
    static singleDocument<T extends AttributesObject>() {
        return new JsonApiSingleDocumentBuilder<SingleResourceDocument<T>>();
    }

    /**
     * Create a new collection document builder.
     */
    static collectionDocument<T extends AttributesObject>() {
        return new JsonApiCollectionDocumentBuilder<CollectionResourceDocument<T>>();
    }
}
