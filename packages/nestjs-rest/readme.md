# nestjs-rest

NestJS utility for creating simple REST/CRUD controllers.

## Usage

Install the package using your package manager of choice:

```shell
npm i nestjs-rest
```

Extend the `RestController` class to create a REST controller:

```typescript
import {Controller, Inject} from "@nestjs/common";
import RestController from "nestjs-rest/controller";
import type RestAdapter from "nestjs-rest/adapter";

@Controller("...")
class UserController extends RestController {
    // make sure to provide the required adapters
    constructor(@Inject("ListOfAdapters") adapters: RestAdapter[]) {
        // pass the adapters to the RestController
        super({adapters});
    }
}
```

## Adapters

...

