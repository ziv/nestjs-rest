import type {ResourceObject} from "std-json-api/json-api-types";

export default class JsonApiResource {
    constructor(
        readonly collection: ResourceObject
    ) {
    }
}