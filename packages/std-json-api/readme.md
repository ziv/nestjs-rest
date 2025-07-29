# std-json-api

Functional standard `JSON:API` serializers.

# Usage

### Creating a resource

```ts
import {resource, identifier, attributes} from 'std-json-api/std-api'

const res = resource(
    identifier('resource-id', 'resource-type'),
    attributes({
        foo: 'bar',
        baz: 42,
    }),
    // ...meta, links, ...
);
```

### Creating a single resource document

```ts
import {resource, resourceData, resourceDocument, identifier, attributes} from 'std-json-api/std-api'

const doc = resourceDocument(
    resourceData({/* resource object, see previous example*/}),
    // ...meta, links, ...
);
```

### Creating a resource collection document

```ts
import {resource, collectionData, collectionDocument, identifier, attributes} from 'std-json-api/std-api'

const doc = collectionDocument(
    collectionData({/* list of resource objects, see previous example*/}),
    // ...meta, links, ...
);
```