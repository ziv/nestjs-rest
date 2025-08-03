import type {
    CollectionResource,
    CollectionResourceDocument,
    JsonApiDocument,
    MetaObject,
    PaginationLinksObject,
    SelfLinkObject,
    SingleResource,
    SingleResourceDocument
} from "./json-api";

export type DataResourceDocument = Partial<SingleResourceDocument | CollectionResourceDocument>;
export type ResourceOrDocument = Partial<JsonApiDocument | SingleResource>;
export type UpdateFn<U> = (doc: U) => U;

function createUpdateFn<Context, Input extends Context[keyof Context]>(key: keyof Context) {
    return function (input: Input): UpdateFn<Context> {
        return (doc: Context) => {
            doc[key] = input;
            return doc;
        };
    }
    // set function name for better debugging
    // const value = (key as string).charAt(0).toUpperCase() + (key as string).slice(1);
    // Object.defineProperty(f, "name", {value});
    // return f;
}


function createPipeFn<Context>(sub = false) {

    return <T>(...fns: UpdateFn<any>[]) => {
        let doc = sub ? {} : {jsonapi: {version: "1.0"}}; // root or not
        for (const fn of fns) {
            doc = fn(doc as Context);
        }
        return doc as T;
    };
}

// DataResourceDocument
export const Data = createUpdateFn<DataResourceDocument, SingleResource | CollectionResource | null>("data");
// ResourceOrDocument
export const Meta = createUpdateFn<ResourceOrDocument, MetaObject>("meta");
export const Links = createUpdateFn<ResourceOrDocument, SelfLinkObject & PaginationLinksObject>("links");
// SingleResource
export const Type = createUpdateFn<Partial<SingleResource>, string>("type");
export const Id = createUpdateFn<Partial<SingleResource>, string>("id");
export const Attributes = createUpdateFn<Partial<SingleResource>, object>("attributes");


// the element under "data" field in a document
export const Resource = createPipeFn<SingleResource>(true);
export const Resources = createPipeFn<CollectionResource>(true);
// root elements
export const SingleDocument = createPipeFn<SingleResourceDocument>();
export const CollectionDocument = createPipeFn<CollectionResourceDocument>();