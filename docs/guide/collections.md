# Resource Collections

Resource Collections are created using the **`ResourceCollection`** class, which is a structured transformation layer for multiple entities, including paginated or cursor-based datasets.

It builds on the same principles as [`Resource`](./resources.md), but operates over a set of items.

A `ResourceCollection`:

- Accepts either:
  - A plain array of items, or
  - A structured object containing `data` plus pagination and/or cursor metadata

- Applies a defined Resource transformer to each item
- Returns a standardized `{ data: [...] }` structure
- Automatically extracts pagination or cursor information into a `meta` object
- Supports additional top-level fields
- Is extendable just like a single Resource

It ensures that collections are:

- Consistently shaped
- Properly transformed per item
- Metadata-aware without polluting the primary data array

When pagination or cursor information exists, it is automatically normalized into:

```json
{
  data: [...],
  meta: { ... }
}
```

This guarantees predictable client-side consumption.

## Basic Collection

```ts
class UserCollection extends ResourceCollection {
  collects = UserResource;

  data() {
    return this.toArray();
  }
}
```

```ts
new UserCollection([{ id: 1, name: 'John' }]);
```

Produces:

```json
{
  "data": [{ "id": 1, "name": "John", "custom": "data" }]
}
```

Each item is transformed using the `collects` resource.

---

## Pagination Support

If input contains a `pagination` object:

```ts
{
  data: [...],
  pagination: {
    currentPage: 1,
    total: 10
  }
}
```

Output becomes:

```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "total": 10
    }
  }
}
```

---

## Cursor Pagination Support

If input contains a `cursor` object:

```ts
{
  data: [...],
  cursor: {
    previous: "abc",
    next: "def"
  }
}
```

Output:

```json
{
  "data": [...],
  "meta": {
    "cursor": {
      "previous": "abc",
      "next": "def"
    }
  }
}
```

---

## Combined Pagination + Cursor

If both exist:

```ts
{
  data: [...],
  pagination: {...},
  cursor: {...}
}
```

Output:

```json
{
  "data": [...],
  "meta": {
    "pagination": {...},
    "cursor": {...}
  }
}
```

---

## Chaining in Collections

Collections also support:

```ts
collection.additional({ status: 'success' }).body;
```

Result:

```json
{
  "data": [...],
  "status": "success"
}
```

Collections also support metadata customization:

- Use class-level `with()` hooks to attach reusable metadata.
- Use `withMeta()` for typed fluent metadata per response.

Details and merge behavior are documented in [Writing Resources - Metadata APIs: with() vs withMeta()](./writing-resources.md#metadata-apis-with-vs-withmeta).

---

## Design Behavior Summary

| Feature             | Resource | ResourceCollection |
| ------------------- | -------- | ------------------ |
| Single item support | ✓        | No                 |
| Array support       | No       | ✓                  |
| Pagination handling | No       | ✓                  |
| Cursor handling     | No       | ✓                  |
| Chainable API       | ✓        | ✓                  |
| Thenable / await    | ✓        | ✓                  |
| Extensible          | ✓        | ✓                  |

---

## Data Flow Model

1. Raw data passed to [`Resource`](./resources.md) / `ResourceCollection`
2. `data()` defines transformation
3. Metadata (pagination/cursor) automatically moves into `meta`
4. `.additional()` merges top-level fields
5. `.response()` prepares transport-layer response
