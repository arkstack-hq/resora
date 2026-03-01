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

For Express and other framewords implementing Connect-style middleware, you will have to pass the response object into the contructor

```ts
import { Resource } from 'resora';

app.get('/:id', async (req, res) => {
  const user = { id: req.params.id, name: 'John Doe' };

  return await new Resource(user, res).additional({ status: 'success' });
});
```

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

You will also have to pass the response object into the contructor for Express and other framewords implementing Connect-style middleware.

```ts
import { ResourceCollection } from 'resora';

app.get('/', async (req, res) => {
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Doe' },
  ];

  return await new ResourceCollection(users, res);
});
```

## Custom Metadata

You can attach custom metadata in two ways:

- `with()` for class-level metadata hooks in custom resources/collections
- `withMeta()` for typed fluent metadata chaining in request handlers

See details and merge behavior in [Writing Resources - Metadata APIs: with() vs withMeta()](./writing-resources.md#metadata-apis-with-vs-withmeta).

## Pagination & Cursor Recipes

For ready-to-copy configuration patterns, see [Pagination & Cursor Quick Recipes](./pagination-cursor-recipes.md).
