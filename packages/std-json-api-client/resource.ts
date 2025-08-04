import type { ResourceObject } from "../../tmp/json-api-types";

export default class JsonApiResource {
  constructor(
    readonly collection: ResourceObject,
  ) {
  }
}
