# std-json-api

Functional standard `JSON:API` serializers, schemas, and utilities for building
`JSON:API` compliant applications.

## Types & Schemas

All types are exported from `std-api`. Each type has a `zod` schema that can be
used to validate the data structure.

```typescript
import type { MetaObject } from "std-json-api/std-api";
import type { metaObject } from "std-json-api/schemas/meta-object";

// validate a meta object example
metaObject.parse({});
```

## ResourceDescriptor

A utility to describe a `JSON:API` resource with its attributes and
relationships.

```typescript
import Describe from "std-json-api/descriptor";

const desc = Describe("resource-id")
  .addAttr("name", "string")
  .addReleationship("related-resource", "related-type", "related-id")
  .build();
```

## Functional Builder API

Provides a functional API for building `JSON:API` documents.

```typescript
import {SingleDocument, Attributes, Meta, Resource, Id, Type} from "std-json-api/builder-fn";

const doc = SingleDocument(
    Meta({}),
    Data(
        Resource(
            Id('...'),
            Type('...'),
            Attributes({
                ...
            })
        )
    )
);
```

## Builder API

Provides an API for building `JSON:API` documents.

```typescript
import JsonApiBuilder from "std-json-api/builder";

const doc = JsonApiBuilder
    .singleDocument()
    .meta({})
    .data(
        JsonApiBuilder.resource()
            .id('...')
            .type('...')
            .attributes({
                ...
            })
    )
```
