import {createParamDecorator, type ExecutionContext} from "@nestjs/common";
import type {Request, Response} from "express";
import {JsonApiDocument,} from "std-json-api/json-api-types";

type ListHeaders = [string, string][];
type Data = JsonApiDocument;
type DataOrCode = Data | number | ListHeaders;

export function send(code: number): Response;
export function send(data: Data): Response;
export function send(headers: ListHeaders): Response;
export function send(code: number, headers: ListHeaders): Response;
export function send(data: Data, code: number): Response;
export function send(data: Data, headers: ListHeaders): Response;
export function send(data: Data, code: number, headers: ListHeaders): Response;
export function send(
  this: {
    res: Response;
  },
  dataOrCode: DataOrCode,
  codeOrHeaders?: number | ListHeaders,
  headers: ListHeaders = [],
): Response {
  let data: any;
  let code: number;

  // Determine if the first argument is a number (status code) or data

  if (!dataOrCode && !codeOrHeaders) { // no arguments at all
    data = undefined;
    code = 204;
  } else if (dataOrCode && !codeOrHeaders) { // first argument exists
    if (typeof dataOrCode === "number") { // is first argument a number? (treat as status code)
      data = undefined;
      code = dataOrCode;
    } else if (Array.isArray(dataOrCode)) { // is it an array? (JSON API document can not be a list)
      data = undefined;
      code = 204; // No content
      headers = dataOrCode; // use as headers
    } else { // so it is probably a JSON API document
      data = dataOrCode;
      code = 200; // default status code
    }
  } else { // both arguments exist
    if (typeof dataOrCode === "number" && Array.isArray(codeOrHeaders)) { // is the first argument a number and the second is a list of headers?
      data = undefined;
      code = dataOrCode;
      headers = codeOrHeaders;
    } else if (typeof codeOrHeaders === "number") { // is the second one a number? (treat as status code)
      data = dataOrCode;
      code = codeOrHeaders;
    } else if (Array.isArray(codeOrHeaders)) { // codeOrHeaders is a list of headers
      data = dataOrCode;
      headers = codeOrHeaders;
      code = 200; // default status code
    } else { // so it is probably an error... todo should we throw an error?
      data = undefined;
      code = 400; // Bad Request
    }
  }
  // defaults
  this.res.set("Content-Type", "application/vnd.api+json").status(code);

  // set extra headers
  for (const [key, value] of headers) {
    this.res.set(key, value);
  }

  // send data or empty response
  return data ? this.res.json(data) : this.res.send();
}

export type JsonApiContext = {
  res: Response;
  req: Request;
  send: typeof send;
  recordId: string;
};

const Context = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const res = ctx.switchToHttp().getResponse<Response>();
  const req = ctx.switchToHttp().getRequest<Request>();

  // default parameters
  const recordId = req.params.id ?? "";

  const fn = send.bind({ res });

  return { res, req, recordId, send: fn };
});

export default Context;
