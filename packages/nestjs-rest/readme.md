# nestjs-rest

NestJS JSON:API controller.

This package provides a base controller class for building RESTful APIs using
the JSON:API specification with NestJS framework.

## Installation

This package required to be installed alongside an extension package, for
example `nestjs-rest-mongodb`.

```shell
npm install nestjs-rest nestjs-rest-mongodb
```

## Creating a Controller

```ts
import { Controller } from "@nestjs/common";
import { JsonApiController } from "nestjs-rest";

// add here autentication and authorization decorators if needed
@Controller("api")
export class MyController extends JsonApiController {
}
```

## Injecting Configuration

```ts
const provider = {
  provide: JsonApiControllersOptions,
  factory: () => {
    // customize options here
    return new JsonApiControllersOptions();
  },
};
```
