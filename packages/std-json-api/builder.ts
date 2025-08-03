/** Builder API for JSON:API documents and resources */
import type {
    AttributesObject,
    BaseDocument,
    CollectionResource,
    CollectionResourceDocument,
    MetaObject,
    PaginationLinksObject,
    SelfLinkObject,
    SingleResource,
    SingleResourceDocument
} from './json-api';
import {Attributes, Data, Id, Links, Meta, Type} from "./builder-fn";


export class JsonApiBaseBuilder<
    T extends BaseDocument = BaseDocument,
> {
    readonly resource: T = {} as T;

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

    links(l: SelfLinkObject & PaginationLinksObject): this {
        Links(l)(this.resource);
        return this;
    }
}

export class JsonApiResourceBuilder
    extends JsonApiBaseBuilder<SingleResource> {
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

export class JsonApiSingleDocumentBuilder<T extends AttributesObject>
    extends JsonApiBaseBuilder<T> {
    data(resources: SingleResource) {
        Data(resources)(this.resource);
        return this;
    }
}

export class JsonApiCollectionDocumentBuilder<T extends BaseDocument>
    extends JsonApiBaseBuilder<T> {
    data(resources: CollectionResource) {
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
    static resource(id: string, type: string) {
        const builder = new JsonApiResourceBuilder();
        builder.id(id);
        builder.type(type);
        return builder;
    }

    /**
     * Create a new single document builder.
     */
    static singleDocument() {
        return new JsonApiSingleDocumentBuilder<SingleResourceDocument>();
    }

    /**
     * Create a new collection document builder.
     */
    static collectionDocument() {
        return new JsonApiCollectionDocumentBuilder<
            CollectionResourceDocument
        >();
    }
}