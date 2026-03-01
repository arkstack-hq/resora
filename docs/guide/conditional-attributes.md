# Conditional Rendering

Resora includes helper methods for conditional attributes directly on:

- `Resource`
- `ResourceCollection`
- `GenericResource`
- Any resource extended from these base classes.

These helpers keep `data()` clean and declarative.

## Available Helpers

- `this.when(condition, value | () => value)`
- `this.whenNotNull(value)`
- `this.mergeWhen(condition, object | () => object)`

## `when(condition, value)`

Include a value only when the condition is truthy.

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      role: this.when(this.isAdmin, 'admin'),
    };
  }
}
```

If `isAdmin` is false, `role` is omitted.

### Lazy callback form

Use a callback if value computation is expensive.

```ts
this.when(this.canViewStats, () => this.buildStats());
```

The callback runs only when the condition is truthy.

## `whenNotNull(value)`

Include a value only when it is not `null` and not `undefined`.

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      email: this.whenNotNull(this.email),
      avatar: this.whenNotNull(this.avatarUrl),
    };
  }
}
```

## `mergeWhen(condition, object)`

Conditionally merge a set of attributes into the output object.

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      ...this.mergeWhen(this.isAdmin, {
        permissions: ['users.read', 'users.write'],
        scope: 'admin',
      }),
    };
  }
}
```

### Lazy callback form

```ts
...this.mergeWhen(this.includeExtra, () => ({
  profile: this.buildProfile(),
}))
```

## Complete Example

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      name: this.name,
      nickname: this.whenNotNull(this.nickname),
      role: this.when(this.isAdmin, 'admin'),
      ...this.mergeWhen(this.isAdmin, {
        permissions: ['manage-users'],
      }),
    };
  }
}
```

## Notes

- Omitted attributes are removed from the final serialized payload.
- These helpers work in collections too, including when using `collects` on `ResourceCollection`.
- For metadata customization, see [Writing Resources](./writing-resources.md#metadata-apis-with-vs-withmeta).
