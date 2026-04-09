# Resora

[![NPM Downloads](https://img.shields.io/npm/dt/resora.svg)](https://www.npmjs.com/package/resora)
[![npm version](https://img.shields.io/npm/v/resora.svg)](https://www.npmjs.com/package/resora)
[![License](https://img.shields.io/npm/l/resora.svg)](https://github.com/arkstack-hq/resora/blob/main/LICENSE)
[![CI](https://github.com/arkstack-hq/resora/actions/workflows/ci.yml/badge.svg)](https://github.com/arkstack-hq/resora/actions/workflows/ci.yml)
[![Deploy Docs](https://github.com/arkstack-hq/resora/actions/workflows/deploy-docs.yml/badge.svg)](https://github.com/arkstack-hq/resora/actions/workflows/deploy-docs.yml)
[![codecov](https://codecov.io/gh/arkstack-hq/resora/graph/badge.svg?token=IBgFGJCoOr)](https://codecov.io/gh/arkstack-hq/resora)

Resora is a structured API response layer for Node.js and TypeScript backends.

It provides a clean, explicit way to transform data into consistent JSON responses and automatically send them to the client. Resora supports single resources, collections, pagination and cursor metadata, conditional attributes, and response customization while remaining framework-agnostic and strongly typed.

Resora is designed for teams that care about long-term maintainability, predictable API contracts, and clean separation of concerns.

---

## What Problem Does Resora Solve?

In most Node.js backends:

- Controllers shape JSON directly
- Response formats drift over time
- Pagination logic is duplicated
- Metadata handling is inconsistent

Resora introduces a dedicated **response transformation layer** that removes these concerns from controllers and centralizes response structure in one place.

---

## Core Capabilities

- Explicit data-to-response transformation
- Automatic JSON response dispatch
- First-class collection support
- Nested resource and collection composition
- Built-in pagination metadata handling
- Built-in cursor metadata handling
- Conditional attribute helpers (`when`, `whenNotNull`, `mergeWhen`)
- Configurable response envelope (`wrap`, `rootKey`, `factory`)
- Configurable pagination URL/link output (`baseUrl`, `pageName`, key mapping)
- Predictable and consistent response contracts
- Strong TypeScript typing
- Transport-layer friendly (Express, H3, and others)

---

## Basic Example

### Single Resource

```ts
import { Resource } from 'resora';

class UserResource extends Resource {
  data() {
    return this.toObject();
  }
}
```

```ts
return new UserResource(user).additional({
  status: 'success',
  message: 'User retrieved',
});
```

Response:

```json
{
  "data": {
    "id": 1,
    "name": "John"
  },
  "status": "success",
  "message": "User retrieved"
}
```

---

### Collection with Pagination

```ts
import { ResourceCollection } from 'resora';

class UserCollection<R extends User[]> extends ResourceCollection<R> {
  collects = UserResource;

  data() {
    return this.toObject();
  }
}
```

```ts
return new UserCollection({
  data: users,
  pagination: {
    currentPage: 1,
    lastPage: 10,
    from: 1,
    to: 10,
    perPage: 10,
    total: 100,
    path: '/users',
  },
}).additional({
  status: 'success',
  message: 'Users retrieved',
});
```

Response:

```json
{
  "data": [...],
  "links": {
    "last": "https://localhost/users?page=10"
  },
  "meta": {
    "from": 1,
    "to": 10,
    "per_page": 10,
    "total": 100,
    "current_page": 1,
    "last_page": 10,
    "path": "/users"
  },
  "status": "success",
  "message": "Users retrieved"
}
```

### Nested Resources and Collections

```ts
import { Resource, ResourceCollection } from 'resora';

class FamilyMemberResource extends Resource {
  data() {
    return {
      id: this.id,
      fullName: `${this.firstName} ${this.lastName}`,
    };
  }
}

class FamilyMemberCollection extends ResourceCollection {
  collects = FamilyMemberResource;

  data() {
    return this.toObject();
  }
}

class FamilyOverviewResource extends Resource {
  data() {
    return {
      members: new FamilyMemberCollection(this.members ?? []),
    };
  }
}
```

Response:

```json
{
  "data": {
    "members": [
      {
        "id": 1,
        "fullName": "Jane Doe"
      }
    ]
  }
}
```

You can also call `.toObject()` explicitly when you want the transformed collection array immediately inside a parent resource.

## Architectural Positioning

Resora sits **between your application logic and the HTTP layer**.

- Controllers handle request flow
- Services handle business logic
- Resora handles response structure

This separation ensures:

- Stable API contracts
- Minimal controller logic
- Clear ownership of response shape

---

## Design Principles

- Explicit over implicit behavior
- Separation of concerns
- Minimal abstraction cost
- Strong typing as a first-class feature
- Framework independence

---

## Framework Compatibility

Resora is not tied to a specific HTTP framework.

It works with:

- Express
- H3
- Any application or framework that supports Connect-style middleware

Adapters can be added without changing application logic.

## Plugin System

Resora exposes a first-class plugin registry for opt-in integrations and lifecycle extensions.

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

Plugins can:

- hook into serialization and response dispatch
- inject framework integrations without core changes
- register reusable transformation utilities

## Conditional Rendering Example

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      email: this.whenNotNull(this.email),
      role: this.when(this.isAdmin, 'admin'),
      ...this.mergeWhen(this.isAdmin, { permissions: ['manage-users'] }),
    };
  }
}
```

Falsy/null attributes are omitted from the final serialized payload.

---

## When to Use Resora

Resora is a good fit if you:

- Build APIs with long-term maintenance in mind
- Care about response consistency across teams
- Want pagination and metadata handled once
- Prefer explicit structure over ad-hoc JSON responses

It is intentionally not opinionated about routing, validation, or persistence.

---

## Documentation

- Getting Started: https://arkstack-hq.github.io/resora/guide/getting-started
- Configuration: https://arkstack-hq.github.io/resora/guide/configuration
- Conditional Rendering: https://arkstack-hq.github.io/resora/guide/conditional-attributes
- Pagination & Cursor Recipes: https://arkstack-hq.github.io/resora/guide/pagination-cursor-recipes

---

## License

MIT
