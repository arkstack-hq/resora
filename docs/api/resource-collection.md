# ResourceCollection

Handles transformation of resource collections.

Supports:

- Pagination metadata
- Cursor metadata
- Resource mapping via `collects`

---

## Constructor

```ts
new ResourceCollection(resource, context?)
```

### Parameters

| Parameter | Type                                  | Description                                  |
| --------- | ------------------------------------- | -------------------------------------------- |
| resource  | ResourceData[] \| Collectible         | Data to transform                            |
| context   | `{ req, res }` \| Response (optional) | HTTP context for auto-send and URL detection |

## Mapping Items

You can define a resource transformer:

```ts
class UserCollection extends ResourceCollection<User[]> {
  collects = UserResource;
}
```

Each item will be transformed using `UserResource`.

If your collection overrides `data()` to return `this.toObject()`, the returned array is the transformed output from `collects`, not the raw underlying items.

```ts
class UserCollection extends ResourceCollection<User[]> {
  collects = UserResource;

  data() {
    return this.toObject();
  }
}
```

This is especially useful when nesting a collection inside another resource:

```ts
class TeamResource extends Resource {
  data() {
    return {
      members: new UserCollection(this.members ?? []),
    };
  }
}
```

Calling `.toObject()` explicitly is also supported:

```ts
class TeamResource extends Resource {
  data() {
    return {
      members: new UserCollection(this.members ?? []).toObject(),
    };
  }
}
```

## Metadata Handling

If the resource contains:

```ts
{
  data: [],
  pagination: {},
  cursor: {}
}
```

Resora automatically adds:

```json
{
  "data": [],
  "meta": {},
  "cursor": {}
}
```
