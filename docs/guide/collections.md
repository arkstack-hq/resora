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
    return this.toObject();
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

If your collection class follows the common pattern below, `toObject()` returns the transformed items produced by `collects`:

```ts
class UserCollection extends ResourceCollection {
  collects = UserResource;

  data() {
    return this.toObject();
  }
}
```

That makes the collection safe to reuse inside another resource.

## Nested Collection Composition

Collections can be nested inside a parent `Resource` in two supported ways.

### 1. Return the collection instance directly

```ts
class FamilyOverviewResource extends Resource {
  data() {
    return {
      id: this.id,
      familyName: this.familyName,
      members: new UserCollection(this.members ?? []),
    };
  }
}
```

### 2. Return the transformed items with `.toObject()`

```ts
class FamilyOverviewResource extends Resource {
  data() {
    return {
      id: this.id,
      familyName: this.familyName,
      members: new UserCollection(this.members ?? []).toObject(),
    };
  }
}
```

Both forms serialize nested items using the collection's `collects` resource. The direct collection form is shorter. The `.toObject()` form is useful when you need to inspect or merge the transformed array before returning it.

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
    "currentPage": 1,
    "total": 10
  }
}
```

### Arkormˣ Paginators

`ResourceCollection` also supports Arkormˣ paginator classes directly:

- `LengthAwarePaginator`
- `Paginator`

```ts
import { ArkormCollection, LengthAwarePaginator, Model } from 'arkormx';
import { ResourceCollection } from 'resora';
import { User } from 'src/models/User';

const models = await User.query().limit(2).paginate();

const data = new ArkormCollection([
  { id: 1, name: 'A' },
  { id: 2, name: 'B' },
]);

const paginator = new LengthAwarePaginator(data, 10, 2, 2, { path: '/users' });
const modelsBody = new ResourceCollection(models).getBody();
const body = new ResourceCollection(paginator).getBody();
```

Example output:

```json
{
  "data": [
    { "id": 1, "name": "A" },
    { "id": 2, "name": "B" }
  ],
  "links": {
    "first": "/users?page=1",
    "last": "/users?page=5",
    "prev": "/users?page=1",
    "next": "/users?page=3"
  },
  "meta": {
    "total": 10,
    "per_page": 2,
    "current_page": 2,
    "last_page": 5,
    "from": 3,
    "to": 4,
    "links": {
      "first": "/users?page=1",
      "last": "/users?page=5",
      "prev": "/users?page=1",
      "next": "/users?page=3"
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
  "cursor": {
    "previous": "abc",
    "next": "def"
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
  "meta":  {...},
  "cursor": {...}
}
```

---

## Chaining in Collections

Collections also support:

```ts
collection.additional({ status: 'success' }).getBody();
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

Collections also support:

- Global/per-class key case customization (`preferredCase`)
- Global/per-class JSON envelope customization (`responseStructure`)
- Class-level outgoing response customization (`withResponse()`)

See:

- [Configuration](./configuration.md#preferredcase---camel-by-default)
- [Configuration](./configuration.md#responsestructure-----rootkey-data--by-default)
- [Writing Resources - Outgoing Response Hook: withResponse()](./writing-resources.md#outgoing-response-hook-withresponse)

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
