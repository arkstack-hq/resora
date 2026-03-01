# Pagination & Cursor Quick Recipes

Use these recipes to quickly configure how pagination and cursor output is emitted.

## 1) Default behavior

```ts
import { defineConfig } from 'resora';

export default defineConfig({
  paginatedExtras: ['meta', 'links'],
  baseUrl: 'https://localhost',
  pageName: 'page',
});
```

When `pagination.path` is available on a collection resource, links are generated as absolute URLs.

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
    "prev": "https://localhost/users?page=1",
    "next": "https://localhost/users?page=3"
  }
}
```

## 2) Custom API domain and page query name

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

## 3) Emit cursor as its own root block

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

## 4) Rename cursor keys with `cursorMeta`

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

## 5) Rename pagination metadata and link keys

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
    "previous": "https://localhost/users?page=1",
    "next": "https://localhost/users?page=3"
  }
}
```

## Notes

- Pagination links are generated from numeric page values (`firstPage`, `lastPage`, `prevPage`, `nextPage`) and `pagination.path`.
- If `paginatedExtras.cursor` is not configured, cursor values are emitted under `meta.cursor` by default.
- `baseUrl` should be set to your public API origin for production responses.
