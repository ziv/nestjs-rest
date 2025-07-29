import type {CollectionResourceDocument} from "std-json-api/json-api-types";
import JsonApiResource from "./resource";
import BaseJsonApi from "./base-json-api";

export default class JsonApiCollection extends BaseJsonApi<CollectionResourceDocument> {
    get data() {
        return this.doc.data ?? [];
    }

    * [Symbol.iterator]() {
        for (const item of this.data) {
            yield new JsonApiResource(item);
        }
    }
}