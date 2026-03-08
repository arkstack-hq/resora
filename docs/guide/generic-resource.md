# GenericResource

`GenericResource` is a flexible serializer that can handle:

- a single object/model
- an array of items
- collectible payloads (`{ data, pagination?, cursor? }`)

Unlike using separate `Resource` and `ResourceCollection` classes, `GenericResource` is useful when one endpoint may return different payload shapes.

## Basic usage

```ts
import { GenericResource } from 'resora';

const payload = { id: 1, name: 'Jane' };
const body = new GenericResource(payload).getBody();
```

```json
{
	"data": {
		"id": 1,
		"name": "Jane"
	}
}
```

## Array usage

```ts
const payload = [
	{ id: 1, name: 'A' },
	{ id: 2, name: 'B' },
];

const body = new GenericResource(payload).getBody();
```

```json
{
	"data": [
		{ "id": 1, "name": "A" },
		{ "id": 2, "name": "B" }
	]
}
```

## Arkormˣ models

`GenericResource` supports Arkormˣ models out of the box.

```ts
import { GenericResource } from 'resora';

const user = await User.query().findOrFail(1);
const body = new GenericResource(user).getBody();
```

`GenericResource` detects Arkormˣ model instances and serializes via `toObject()` automatically.

### Eager-loaded relations

```ts
const user = await User.query().with(['profile', 'posts']).findOrFail(1);
const body = new GenericResource(user).getBody();
```

```json
{
	"data": {
		"id": 1,
		"name": "Jane",
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

### Array of Arkormˣ models

```ts
const users = await User.query().limit(2).get();
const body = new GenericResource(users.all()).getBody();
```

## Metadata and envelope customization

`GenericResource` supports the same customization APIs as other resources:

- `with()` / `withMeta()` for metadata
- `additional()` for top-level fields
- `preferredCase` for key casing
- `responseStructure` for wrapping/root key behavior

See also:

- [Resources](./resources.md)
- [Collections](./collections.md)
- [Configuration](./configuration.md)
