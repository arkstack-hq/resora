# Writing Resources

Resora is designed to be extended.

You rarely use [`Resource`](./resources.md) directly in real applications. Instead, you create custom resource classes that define how your domain objects are transformed before being returned to the client.

This section explains how to create:

- Custom [`Resource`](./resources.md) classes
- Custom [`ResourceCollection`](./collections.md) classes
- Paginated and cursor-aware collections

## Extending `Resource`

A `Resource` represents a single entity transformation.

To create one, extend the base `Resource` class and override the `data()` method.

### Basic Resource Extension

```ts
import { Resource } from 'resora';

class UserResource extends Resource {
  data() {
    return this.toArray();
  }
}
```

Usage:

```ts
const resource = { id: 1, name: 'John Doe' };
const userResource = new UserResource(resource);

userResource.json().body;
```

Output:

```json
{
  "data": {
    "id": 1,
    "name": "John Doe"
  }
}
```

### Transforming Fields

You can shape the output however you like inside `data()`.

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      name: this.name,
      custom: 'data',
    };
  }
}
```

Usage:

```ts
const resource = { id: 1, name: 'John Doe' };
const userResource = new UserResource(resource);

userResource.json().body;
```

Output:

```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "custom": "data"
  }
}
```

Key point:

- `this.id` and `this.name` are accessible because the base class proxies properties from the original resource.

## Metadata APIs: `with()` vs `withMeta()`

Resora supports two metadata patterns:

- `with()` as a **class hook** (override in custom classes)
- `withMeta()` as a **typed fluent API** (chain in handlers/services)

### Class hook: `with()`

Use this when the resource class should always contribute metadata.

```ts
class UserResource extends Resource {
  with() {
    return {
      source: 'user-resource',
      apiVersion: 'v1',
    };
  }
}
```

When `json()` runs, this metadata is merged into `meta` automatically.

### Fluent API: `withMeta()`

Use this for per-request metadata and strong TypeScript inference.

```ts
const body = new UserResource({ id: 1, name: 'John' })
  .withMeta((resource) => ({ actor: resource.name }))
  .withMeta({ traceId: 'abc-123' })
  .json().body;
```

### Merge behavior

Metadata is merged (deeply) in this order:

1. Built-in defaults (e.g. `pagination` / `cursor` for collections)
2. Class hook metadata from `with()`
3. Fluent metadata from `withMeta(...)` and/or `with({...})`

So custom metadata does not replace important defaults unless you explicitly overwrite the same key.

## Creating Collections From a Resource

Every `Resource` subclass can generate a collection using the static `collection()` method.

```ts
const resource = [{ id: 1, name: 'John Doe' }];

const collection = userResource.collection(resource);

collection.json().body;
```

Output:

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "custom": "data"
    }
  ]
}
```

The returned instance is a `ResourceCollection`.

## Extending `ResourceCollection`

When you need more control over collections, extend `ResourceCollection` directly.

You must define:

- `collects` → the Resource class used per item
- `data()` → how the transformed array is returned

### Non-Paginated Collection

```ts
import { ResourceCollection } from 'resora';

class UserCollection<R extends User[]> extends ResourceCollection<R> {
  collects = UserResource;

  data() {
    return this.toArray();
  }
}
```

Usage:

```ts
const resource = [{ id: 1, name: 'John Doe' }];

const collection = new UserCollection(resource);

collection.json().body;
```

Output:

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "custom": "data"
    }
  ]
}
```

## Paginated Collections

If your collection input contains pagination metadata:

```ts
const resource = {
  data: [{ id: 1, name: 'John Doe' }],
  pagination: { currentPage: 1, total: 10 },
};
```

Using the same `UserCollection`:

```ts
const collection = new UserCollection(resource);

collection.json().body;
```

Output:

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "custom": "data"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "total": 10
    }
  }
}
```

Pagination metadata is automatically extracted into `meta.pagination`.

## Cursor-Based Collections

If your input includes cursor metadata:

```ts
const resource = {
  data: [{ id: 1, name: 'Acm. Inc.' }],
  cursor: { previous: 'abc', next: 'def' },
};
```

Output:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Acm. Inc.",
      "custom": "data"
    }
  ],
  "meta": {
    "cursor": {
      "previous": "abc",
      "next": "def"
    }
  }
}
```

Cursor metadata is automatically mapped to `meta.cursor`.

## Pagination + Cursor Together

If both are present:

```ts
const resource = {
  data: [{ id: 1, name: 'Acm. Inc.' }],
  pagination: { currentPage: 1, total: 10 },
  cursor: { previous: 'abc', next: 'def' },
};
```

Output:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Acm. Inc.",
      "custom": "data"
    }
  ],
  "meta": {
    "pagination": { "currentPage": 1, "total": 10 },
    "cursor": { "previous": "abc", "next": "def" }
  }
}
```

Both metadata types are preserved.

## Chaining With Extended Resources

Both `Resource` and `ResourceCollection` support chaining.

Example:

```ts
collection.additional({ status: 'success' }).json().body;
```

Output:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Acm. Inc.",
      "custom": "data"
    }
  ],
  "status": "success"
}
```

## Design Rules When Writing Resources

1. Always override `data()` when extending.
2. Use `this.property` to access original data fields.
3. Use `this.toArray()` inside collections to transform all items.
4. Define `collects` when extending `ResourceCollection`.
5. Let metadata extraction remain automatic.
