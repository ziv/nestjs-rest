import type {JsonApiDocumentBase} from "std-json-api/json-api-types";

export default class BaseJsonApi<Doc extends JsonApiDocumentBase> {
    constructor(
        readonly doc: Doc
    ) {
    }

    get jsonapi() {
        return this.doc.jsonapi ?? {};
    }

    get links() {
        return this.doc.links ?? {};
    }

    get meta() {
        return this.doc.meta ?? {};
    }
}