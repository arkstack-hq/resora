# Resources

Resources are created using the **`Resource`** class, which is a transformation layer responsible for shaping a single domain object into a predictable JSON response structure.

It does not merely wrap data — it defines **how raw data becomes API output**.

A `Resource`:

- Accepts a single object (plain object, model instance, DTO, etc.)
- Controls how that object is serialized
- Wraps the transformed output inside a standardized `{ data: ... }` envelope
- Supports attaching additional top-level fields
- Can behave like a Promise (it is awaitable)
- Is designed to be extended for custom transformation logic

Think of it as the boundary between your internal data structures and your public API contract.

Instead of returning raw objects from your application layer, a `Resource` ensures:

- Response consistency
- Centralized formatting logic
- Extensibility without mutating original data
- Clean separation between domain logic and presentation logic

When extended, the `data()` method becomes the canonical place where transformation rules live.

## Creating a Resource

```ts
import { Resource } from 'resora';

const user = { id: 1, name: 'John' };

const resource = new Resource(user);
```

## Accessing Raw Data

```ts
resource.data();
```

Returns the original resource payload unless overridden.

```json
{ "id": 1, "name": "John" }
```

## JSON Response Format

Calling `.json()` prepares a structured response:

```ts
resource.getBody();
```

Produces:

```json
{
  "data": {
    "id": 1,
    "name": "John"
  }
}
```

## Arkormˣ Models

Resora detects Arkormˣ model instances automatically and serializes them through the model's `toObject()` output.

```ts
import { Resource } from 'resora';

const user = await User.query().findOrFail(1);

const body = new Resource(user).getBody();
```

Result:

```json
{
  "data": {
    "id": 1,
    "name": "Jane Doe"
  }
}
```

Eager-loaded Arkormˣ relationships are also serialized recursively:

```ts
const user = await User.query().with(['profile', 'posts']).findOrFail(1);

const body = new Resource(user).getBody();
```

```json
{
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "profile": {
      "id": 10,
      "bio": "Creator"
    },
    "posts": [
      { "id": 100, "title": "First" },
      { "id": 101, "title": "Second" }
    ]
  }
}
```

## Adding Additional Data

You may attach extra top-level fields:

```ts
resource.additional({ status: 'success' }).getBody();
```

Result:

```json
{
  "data": {
    "id": 1,
    "name": "John"
  },
  "status": "success"
}
```

`additional()` is chainable.

## Metadata Customization

Resources also support metadata customization via `with()` and `withMeta()`.

- Use `with()` for class-level metadata hooks.
- Use `withMeta()` for typed fluent metadata chaining.

See the full guide in [Writing Resources - Metadata APIs: with() vs withMeta()](./writing-resources.md#metadata-apis-with-vs-withmeta).

## Response Customization

You can also customize:

- Payload key casing via `preferredCase`
- JSON envelope via `responseStructure`
- Final outgoing transport response via `withResponse()`

See:

- [Configuration](./configuration.md#preferredcase---camel-by-default)
- [Configuration](./configuration.md#responsestructure-----rootkey-data--by-default)
- [Writing Resources - Outgoing Response Hook: withResponse()](./writing-resources.md#outgoing-response-hook-withresponse)

## Building a Response Object

```ts
const response = resource.response(res);
```

This returns a response-compatible object.
The structure is framework-agnostic.

## Thenable Support (Async/Await)

`Resource` is promise-like.

```ts
const result = await resource;
```

Resolves to:

```json
{
  "data": {
    "id": 1,
    "name": "John"
  }
}
```

This allows usage like:

```ts
return await new UserResource(user);
```

## Extending Resource

Resources are meant to be extended.

### Custom Transformation

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

```ts
new UserResource({ id: 1, name: 'John' }).data();
```

Result:

```json
{
  "id": 1,
  "name": "John",
  "custom": "data"
}
```

### Accessing Original Payload

Inside extended classes:

- `this.toArray()` returns original payload
- Properties are proxied (`this.id`, `this.name`)

### Chaining Still Works

Extended resources retain:

- `.json()`
- `.additional()`
- `.response()`
- `await` support
