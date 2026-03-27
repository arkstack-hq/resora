# Pagination & Cursor Quick Recipes

Use these recipes to quickly configure how pagination and cursor output is emitted.

## 1. Default behavior

```ts
import { defineConfig } from 'resora';

export default defineConfig({
  paginatedExtras: ['meta', 'links'],
  baseUrl: '',
  pageName: 'page',
});
```

When `pagination.path` is available on a collection resource, links are generated as path-relative URLs. If a `baseUrl` is configured or the request URL is [auto-detected from context](#url-detection), links become absolute.

Example:

```json
{
  "data": [{ "id": 1 }],
  "meta": {
    "current_page": 2,
    "last_page": 10,
    "path": "/users"
  },
  "links": {
    "prev": "/users?page=1",
    "next": "/users?page=3"
  }
}
```

## 2. Custom API domain and page query name

```ts
import { defineConfig } from 'resora';

export default defineConfig({
  baseUrl: 'https://api.example.com/v1',
  pageName: 'p',
});
```

Generated links become:

```json
{
  "links": {
    "first": "https://api.example.com/v1/users?p=1",
    "next": "https://api.example.com/v1/users?p=3"
  }
}
```

## 3. Emit cursor as its own root block

```ts
import { defineConfig } from 'resora';

export default defineConfig({
  paginatedExtras: {
    meta: 'meta',
    links: 'links',
    cursor: 'cursor',
  },
});
```

Cursor output:

```json
{
  "data": [{ "id": 1 }],
  "cursor": {
    "previous": "cursor_prev",
    "next": "cursor_next"
  }
}
```

## 4. Rename cursor keys with `cursorMeta`

```ts
import { defineConfig } from 'resora';

export default defineConfig({
  paginatedExtras: {
    cursor: 'cursor_info',
  },
  cursorMeta: {
    previous: 'before',
    next: 'after',
  },
});
```

Cursor output:

```json
{
  "cursor_info": {
    "before": "cursor_prev",
    "after": "cursor_next"
  }
}
```

## 5. Rename pagination metadata and link keys

```ts
import { defineConfig } from 'resora';

export default defineConfig({
  paginatedMeta: {
    current_page: 'currentPage',
    last_page: 'lastPage',
    per_page: 'perPage',
    total: 'totalItems',
    path: 'endpoint',
  },
  paginatedLinks: {
    prev: 'previous',
    next: 'next',
    first: 'first',
    last: 'last',
  },
});
```

Example output:

```json
{
  "meta": {
    "currentPage": 2,
    "lastPage": 10,
    "perPage": 25,
    "totalItems": 250,
    "endpoint": "/users"
  },
  "links": {
    "previous": "/users?page=1",
    "next": "/users?page=3"
  }
}
```

## 6. Use request page params as Arkorm defaults

When Arkorm pagination runs before you build the response, wire Resora's request
URL parsing into Arkorm's runtime resolver.

```ts
import { Resource, createArkormCurrentPageResolver } from 'resora';
import { configureArkormRuntime } from 'arkormx';

app.use((req, _res, next) => {
  Resource.setCtx({ req });
  next();
});

configureArkormRuntime(() => prisma, {
  pagination: {
    resolveCurrentPage: createArkormCurrentPageResolver(),
  },
});

const users = await User.query().paginate(15, undefined, {
  pageName: 'p',
});
```

With a request like `/users?p=3`, Arkorm will default to page `3` and Resora
will generate links using the same `pageName`.

## Notes

- Pagination links are generated from numeric page values (`firstPage`, `lastPage`, `prevPage`, `nextPage`) and `pagination.path`.
- If `paginatedExtras.cursor` is not configured, cursor values are emitted under `meta.cursor` by default.
- Set `baseUrl` to your public API origin for absolute URLs in production, or use [URL auto-detection](#url-detection) to derive paths from the request context.

## 7. Automatic URL detection from request context {#url-detection}

When your pagination data does **not** include an explicit `path`, Resora can automatically detect the current request URL from the HTTP context and use it for link generation — including any existing query string parameters.

This works with both **Express** and **H3** because both expose a `{ req, res }` context shape.

### Passing context to the constructor

Pass the full `{ req, res }` context (or the framework event) as the second argument:

::: code-group

```ts [Express]
app.get('/api/users', async (req, res) => {
  const users = await getUsers(req.query);

  // Pass { req, res } — Resora reads req.originalUrl for the path
  return await new ResourceCollection(users, { req, res });
});
```

```ts [H3]
export default defineEventHandler((event) => {
  const users = await getUsers(getQuery(event));

  // Pass the H3 event — Resora reads event.req.url
  return new ResourceCollection(users, event);
});
```

:::

If the user navigates to `/api/users?search=foo&sort=name`, the generated links will preserve the query string:

```json
{
  "links": {
    "first": "/api/users?search=foo&sort=name&page=1",
    "next": "/api/users?search=foo&sort=name&page=2"
  }
}
```

With `baseUrl` configured, the links become full URLs:

```json
{
  "links": {
    "first": "https://api.example.com/api/users?search=foo&sort=name&page=1",
    "next": "https://api.example.com/api/users?search=foo&sort=name&page=2"
  }
}
```

::: tip Priority
An explicit `pagination.path` always takes precedence over the auto-detected URL. If both are present, the explicit path wins.
:::

### Using `setCtx()` in middleware

If you prefer to set the request context once in a middleware (instead of passing it to each resource), use the static `setCtx()` method available on all serializer classes:

::: code-group

```ts [Express]
import { Resource } from 'resora';

// Register middleware before your routes
app.use((req, res, next) => {
  Resource.setCtx({ req, res });
  next();
});

// In your route handler — no need to pass context
app.get('/api/users', async (req, res) => {
  const users = await getUsers(req.query);
  return await new ResourceCollection(users, res);
});
```

```ts [H3]
import { Resource } from 'resora';

app.use((event) => {
  Resource.setCtx(event);
});

export default defineEventHandler((event) => {
  return new ResourceCollection(users);
});
```

:::

`setCtx()` is inherited by `Resource`, `ResourceCollection`, and `GenericResource` — calling it on any one of them makes the request URL available for all of them.

::: warning Request scoping
`setCtx()` stores the URL globally. If your application handles concurrent requests in a shared process, call `setCtx()` at the start of each request to ensure accuracy. For single-request-per-process runtimes (serverless, edge workers), this is automatic.
:::

### How URL extraction works

Resora inspects the context using the common `{ req, res }` interface:

| Framework | Request URL source                 | Example value                         |
| --------- | ---------------------------------- | ------------------------------------- |
| Express   | `req.originalUrl`                  | `/api/users?search=foo`               |
| H3        | `req.url` (Web standard `Request`) | `http://localhost:3000/api/users?q=1` |

For H3's Web standard `Request`, the full URL is parsed and only the pathname + search is used for link generation.

If a bare response object is passed (without `req`), URL detection is skipped and the resource falls back to `pagination.path` or the bare `/?page=X` format.
