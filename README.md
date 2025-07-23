# nestjs-rest

A simple REST/CRUD controller for NestJS.

## Overview

### Endpoints

The `RestController` class provides a set of endpoints for basic CRUD operations for multiple resources. The endpoints
are:

#### CRUD Endpoints

- `GET /<resource>` - List all resources, supports pagination and filtering.
- `GET /<resource>/:id` - Get a single resource by ID.
- `POST /<resource>` - Create a new resource.
- `PUT /<resource>/:id` - Replace an existing resource by ID.
- `PATCH /<resource>/:id` - Partially update a resource by ID.
- `DELETE /<resource>/:id` - Delete a resource by ID.

#### Search Endpoints

- `POST /<resource>/srarch` - Search for resources using a custom query. The query is passed in the request body.
  Supports pagination and filtering.

#### Pagination and Filtering

The request support the following query parameters for pagination and filtering:

- `page` - The page number to return (default: 0).
- `size` - The number of items to return per page (default: 20).
- `sort` - The field to sort by (default: `id`).
- `dir` - The direction to sort by, either `asc` or `desc` (default: `asc`).

### Data Structure

The `RestController` responds with a consistent data structure for all endpoints. The response structure is as follows:

The data structure will be changed in the future to be JSON:API compliant, but for now it is a simple structure.

**Single resource response:**

```typescript
type Response<T> = { data: T };
```

**Multiple resources response:**

```typescript
type ResponseList<T> = {
    data: T[];
    total: number; // Total number of resources
    page: number; // Current page number
    size: number; // Number of items per page
};
```

## Usage

The following example shows how to use the `nestjs-rest` package with a MongoDB database.

```shell
npm i nestjs-rest nestjs-rest-mongodb
```

The rest controller accepts a list of adapters that implement the `RestAdapter` interface. Each adapter is responsible
for handling a specific resource. Each adapter can handle different databases or data sources.

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

# TODO

- [x] Add a MongoDB adapter.
- [ ] Add any SQL DB adapter.
- [ ] Add Typeorm support.
- [ ] Convert to be JSON:API compliant.