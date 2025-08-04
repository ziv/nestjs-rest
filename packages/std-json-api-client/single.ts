import type { SingleResourceDocument } from "../../tmp/json-api-types";
import BaseJsonApi from "./base-json-api";

export default class JsonApiSingle extends BaseJsonApi<SingleResourceDocument> {
  get data() {
    return this.doc.data ?? {};
  }
}
