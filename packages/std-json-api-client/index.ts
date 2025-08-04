import qs from "qs";
import {
    AttributesObject,
    BaseDocument,
    CollectionResourceDocument,
    SingleResourceDocument
} from "std-json-api/json-api";
import {JsonApiQuery} from "std-json-api/query-string-parser";

export type JsonApiClientOptions = {
    baseUrl: string;
    resource: string;
    headers?: [string, string][];
};

const MIME_TYPE = "application/vnd.api+json";

export class JsonDocumentWrapper<T extends BaseDocument = SingleResourceDocument> implements BaseDocument {
    constructor(protected readonly resource: T) {
    }

    get jsonapi() {
        return this.resource.jsonapi ?? {version: "1.0"};
    }

    get links() {
        return this.resource.links;
    }

    get meta() {
        return this.resource.meta;
    }

    get included() {
        return this.resource.included;
    }

    get data() {
        return ('data' in this.resource) ? this.resource.data : null;
    }

}

export class JsonCollectionWrapper extends JsonDocumentWrapper<CollectionResourceDocument> {
    * [Symbol.iterator]() {
        if (Array.isArray(this.resource.data)) {
            for (const item of this.resource.data) {
                yield item;
            }
        }
        return;
    }
}

export default class JsonApiClient {
    readonly url: string;
    readonly headers: Headers;

    constructor(readonly options: JsonApiClientOptions) {
        this.url = `${this.options.baseUrl}/${this.options.resource}`;
        this.headers = new Headers([
            ...(this.options.headers ?? []),
            ['Accept', MIME_TYPE],
            ['Content-Type', MIME_TYPE]
        ]);
    }

    async record(id: string) {
        const ret = await this.#request<SingleResourceDocument>(`${this.url}/${id}`);
        return new JsonDocumentWrapper(ret);
    }

    async records(query: Partial<JsonApiQuery>) {
        const raw = await this.#request<CollectionResourceDocument>(`${this.url}?${qs.stringify(query)}`);
        return new JsonCollectionWrapper(raw);
    }

    async create(model: AttributesObject) {
        const ret = await this.#request<SingleResourceDocument>(this.url, 'POST', model);
        return new JsonDocumentWrapper(ret);
    }

    async update(id: string, model: AttributesObject) {
        const ret = await this.#request<SingleResourceDocument>(`${this.url}/${id}`, 'DELETE', model);
        return new JsonDocumentWrapper(ret);
    }

    async delete(id: string) {
        const ret = await this.#request<SingleResourceDocument>(`${this.url}/${id}`, 'DELETE');
        return new JsonDocumentWrapper(ret);
    }

    async #request<T>(url: string, method?: string, body?: AttributesObject) {
        const init = {
            method: method ?? 'GET',
            headers: this.headers,
            body: body ? JSON.stringify(body) : undefined
        };
        const res = await fetch(url, init);
        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}, ${res.statusText}`);
        }
        return await res.json() as T;
    }
}
