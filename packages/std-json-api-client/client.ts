import qs from 'qs';
import JsonApiCollection from "./collection";
import {AttributesObject, CollectionResourceDocument} from "std-json-api/json-api-types";

export type Params = { [key: string]: unknown };

export type JsonApiClientOptions = {
    baseUrl: string;
    resource: string;
    headers?: [string, string][];
}

export type Req = { path?: string, params?: Params };

export default class JsonApiClient<Model extends AttributesObject> {
    constructor(readonly options: JsonApiClientOptions) {
    }
    
    async records(params?: Params) {
        const doc = await this.request<CollectionResourceDocument<Model>>({params});
        return new JsonApiCollection(doc);
    }

    async request<T>({path, params}: Req, {method, headers, body}: RequestInit = {}) {
        const requestMethod = method ?? 'GET';

        console.log(this.options);
        const url = (path
            ? `${this.options.baseUrl}/${this.options.resource}/${path}`
            : `${this.options.baseUrl}/${this.options.resource}`) + (params ? `/${qs.stringify(params)}` : '');
        console.log(url);

        const requestHeaders = new Headers(this.options.headers ?? []);
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                requestHeaders.set(key, value);
            }
        }
        requestHeaders.set('Accept', 'application/vnd.api+json');


        const res = await fetch(url, {
            method: requestMethod,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            throw new Error(`Request failed "${res.statusText}" (${res.status})`);
        }

        return await res.json() as T;
    }
}