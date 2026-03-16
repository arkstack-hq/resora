# Getting Started

## Installation

::: code-group

```bash [npm]
npm install resora
```

```bash [pnpm]
pnpm add resora
```

```bash [yarn]
yarn add resora
```

:::

## Basic Usage

Resora provides two primary primitives:

- [`Resource`](./resources.md)
- [`ResourceCollection`](./collections.md)

These classes define how data is transformed and structured before being returned as JSON.

### Resource

`Resource` represents a single data entity.

```ts
import { Resource } from 'resora';

app.get('/:id', async () => {
  const user = { id: 1, name: 'John Doe' };

  return await new Resource(user).additional({ status: 'success' });
});
```

For Express and other frameworks implementing Connect-style middleware, pass the `{ req, res }` context into the constructor. This enables both auto-send and [automatic URL detection](/guide/pagination-cursor-recipes#url-detection) for pagination links.

```ts
import { Resource } from 'resora';

app.get('/:id', async (req, res) => {
  const user = { id: req.params.id, name: 'John Doe' };

  return await new Resource(user, { req, res }).additional({
    status: 'success',
  });
});
```

::: tip
Passing just `res` still works for backward compatibility, but won't enable URL detection.
:::

### Collection

`ResourceCollection` handles arrays and paginated datasets.

```ts
import { ResourceCollection } from 'resora';

app.get('/', async () => {
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Doe' },
  ];

  return await new ResourceCollection(users);
});
```

You can also pass the `{ req, res }` context into the constructor for Express and other frameworks implementing Connect-style middleware.

```ts
import { ResourceCollection } from 'resora';

app.get('/', async (req, res) => {
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Doe' },
  ];

  return await new ResourceCollection(users, { req, res });
});
```

## Custom Metadata

You can attach custom metadata in two ways:

- `with()` for class-level metadata hooks in custom resources/collections
- `withMeta()` for typed fluent metadata chaining in request handlers

See details and merge behavior in [Writing Resources - Metadata APIs: with() vs withMeta()](./writing-resources.md#metadata-apis-with-vs-withmeta).

## Pagination & Cursor Recipes

For ready-to-copy configuration patterns, see [Pagination & Cursor Quick Recipes](./pagination-cursor-recipes.md).

## Using Non-Connect Frameworks

If you are using frameworks outside H3/Express or non-Connect response styles, see [Using Resora Outside H3/Express (Non-Connect Frameworks)](./non-connect-frameworks.md).
