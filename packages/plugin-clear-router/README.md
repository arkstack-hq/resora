# @resora/plugin-clear-router

[![NPM Downloads](https://img.shields.io/npm/dt/@resora/plugin-clear-router.svg)](https://www.npmjs.com/package/@resora/plugin-clear-router)
[![npm version](https://img.shields.io/npm/v/@resora/plugin-clear-router.svg)](https://www.npmjs.com/package/@resora/plugin-clear-router)
[![License](https://img.shields.io/npm/l/@resora/plugin-clear-router.svg)](https://github.com/arkstack-hq/resora/blob/main/LICENSE)
[![CI](https://github.com/arkstack-hq/resora/actions/workflows/ci.yml/badge.svg)](https://github.com/arkstack-hq/resora/actions/workflows/ci.yml)
[![Deploy Docs](https://github.com/arkstack-hq/resora/actions/workflows/deploy-docs.yml/badge.svg)](https://github.com/arkstack-hq/resora/actions/workflows/deploy-docs.yml)
[![codecov](https://codecov.io/gh/arkstack-hq/resora/graph/badge.svg?token=IBgFGJCoOr)](https://codecov.io/gh/arkstack-hq/resora)

This plugin lets [clear-router](https://arkstack-hq.github.io/clear-router) route handlers return Resora resources directly.

Use it when your application routes are registered through clear-router and you want inline handlers or controller actions to return `Resource`, `ResourceCollection`, or other Resora thenables without manually calling `.response(...)`.

## Why

`resora` resources are thenables, while `clear-router` automatically resolves and serializes values returned from route handlers and controller actions.

These plugins bind the active `clear-router` request context to Resora before your handler executes, allowing resources to work seamlessly when returned directly from routes or controllers.

Without the plugin, returning resources may not have access to the active request lifecycle or response context.

## Installation

```bash [pnpm]
pnpm add resora @resora/plugin-clear-router
```

OR

```bash [npm]
npm install resora @resora/plugin-clear-router
```

OR

```bash [yarn]
yarn add resora @resora/plugin-clear-router
```

## Usage

Register the plugin before defining routes.

### Express

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

### Fastify

```ts
import { registerPlugin } from 'resora';
import { clearRouterFastifyPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterFastifyPlugin);
```

### H3

```ts
import { registerPlugin } from 'resora';
import { clearRouterH3Plugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterH3Plugin);
```

### Hono

```ts
import { registerPlugin } from 'resora';
import { clearRouterHonoPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterHonoPlugin);
```

### Koa

```ts
import { registerPlugin } from 'resora';
import { clearRouterKoaPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterKoaPlugin);
```

### All Adapters

Register the bundled plugin array when the same process uses more than one supported clear-router adapter.

```ts
import { registerPlugin } from 'resora';
import { clearRouterPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterPlugin);
```

## Returning Resources from Controllers

Once registered, resources can be returned directly from controller methods.

```ts
import { Router, Controller } from 'clear-router';
import { Resource } from 'resora';

class UserController extends Controller {
  index() {
    return new Resource({
      id: 1,
      name: 'Ada',
    });
  }
}

Router.get('/users', [UserController, 'index']);
```

## Returning Resources from Inline Handlers

Resources also work in direct route callbacks.

```ts
import { Router } from 'clear-router';
import { Resource } from 'resora';

Router.get('/users', () => {
  return new Resource({
    id: 1,
    name: 'Ada',
  });
});
```

## Exports

| Export                     | Description                 |
| -------------------------- | --------------------------- |
| `clearRouterExpressPlugin` | Express runtime integration |
| `clearRouterFastifyPlugin` | Fastify runtime integration |
| `clearRouterH3Plugin`      | H3 runtime integration      |
| `clearRouterHonoPlugin`    | Hono runtime integration    |
| `clearRouterKoaPlugin`     | Koa runtime integration     |
| `clearRouterPlugin`        | All adapter integrations    |

## Notes

Plugins are opt-in and do not modify `clear-router` or `resora` globally unless explicitly registered.

Only register the plugin matching the runtime used by your Clear Router application.

Controller arguments resolved through clear-router's container retain their configured singleton, request, or transient lifetime when the controller returns a Resora resource.
