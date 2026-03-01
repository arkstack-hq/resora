# Resora

[![NPM Downloads](https://img.shields.io/npm/dt/resora.svg)](https://www.npmjs.com/package/resora)
[![npm version](https://img.shields.io/npm/v/resora.svg)](https://www.npmjs.com/package/resora)
[![License](https://img.shields.io/npm/l/resora.svg)](https://github.com/arcstack-hq/resora/blob/main/LICENSE)
[![CI](https://github.com/arcstack-hq/resora/actions/workflows/ci.yml/badge.svg)](https://github.com/arcstack-hq/resora/actions/workflows/ci.yml)
[![Deploy Docs](https://github.com/arcstack-hq/resora/actions/workflows/deploy-docs.yml/badge.svg)](https://github.com/arcstack-hq/resora/actions/workflows/deploy-docs.yml)

Resora is a structured API response layer for Node.js and TypeScript backends.

It provides a clean, explicit way to transform data into consistent JSON responses and automatically send them to the client. Resora supports single resources, collections, and pagination metadata while remaining framework-agnostic and strongly typed.

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
- Built-in pagination metadata handling
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
    return this.toArray();
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
    return this.toArray();
  }
}
```

```ts
return new UserCollection({
  data: users,
  pagination: {
    from: 1,
    to: 10,
    perPage: 10,
    total: 100,
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
  "meta": {
    "pagination": {
      "from": 1,
      "to": 10,
      "perPage": 10,
      "total": 100
    }
  },
  "status": "success",
  "message": "Users retrieved"
}
```

---

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

---

## When to Use Resora

Resora is a good fit if you:

- Build APIs with long-term maintenance in mind
- Care about response consistency across teams
- Want pagination and metadata handled once
- Prefer explicit structure over ad-hoc JSON responses

It is intentionally not opinionated about routing, validation, or persistence.

---

## License

MIT
