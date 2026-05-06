# Clear Router Plugin

`@resora/plugin-clear-router` lets clear-router route handlers return Resora resources directly.

Use it when your application routes are registered through clear-router and you want inline handlers or controller actions to return `Resource`, `ResourceCollection`, or other Resora thenables without manually calling `.response(...)`.

## Install

```bash
pnpm add @resora/plugin-clear-router clear-router
```

Install the HTTP framework adapter you use with clear-router, such as Express, Fastify, Hono, or H3.

## Register

Register the plugin for the clear-router adapter you use.

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

Available exports:

- `clearRouterExpressPlugin`
- `clearRouterFastifyPlugin`
- `clearRouterH3Plugin`
- `clearRouterHonoPlugin`
- `clearRouterPlugin`

`clearRouterPlugin` registers all available clear-router adapter bridges.

## Express

```ts
import express from 'express';
import { Router } from 'clear-router/express';
import { Resource, registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);

const app = express();
const router = express.Router();

Router.get('/users/1', () => {
  return new Resource({ id: 1, name: 'Ada' });
});

await Router.apply(router);
app.use(router);
```

## Fastify

```ts
import Fastify from 'fastify';
import { Router } from 'clear-router/fastify';
import { Resource, registerPlugin } from 'resora';
import { clearRouterFastifyPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterFastifyPlugin);

const app = Fastify();

Router.get('/users/1', () => {
  return new Resource({ id: 1, name: 'Ada' });
});

Router.apply(app);
```

## Hono

```ts
import { Hono } from 'hono';
import { Router } from 'clear-router/hono';
import { Resource, registerPlugin } from 'resora';
import { clearRouterHonoPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterHonoPlugin);

const app = new Hono();

Router.get('/users/1', () => {
  return new Resource({ id: 1, name: 'Ada' });
});

Router.apply(app);
```

## H3

```ts
import { H3 } from 'h3';
import { Router } from 'clear-router/h3';
import { Resource, registerPlugin } from 'resora';
import { clearRouterH3Plugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterH3Plugin);

const app = new H3();

Router.get('/users/1', () => {
  return new Resource({ id: 1, name: 'Ada' });
});

const router = Router.apply(app);
```

## Controllers

The plugin also works with clear-router controller actions.

```ts
import { Controller } from 'clear-router';
import { Router } from 'clear-router/express';
import { Resource } from 'resora';

class UserController extends Controller {
  show() {
    return new Resource({ id: this.params.id, name: 'Ada' });
  }
}

Router.get('/users/:id', [UserController, 'show']);
```

## Response Mutations

Resource `withResponse()` hooks can still set headers and status codes.

```ts
import { Resource } from 'resora';

class UserResource extends Resource {
  withResponse(response) {
    response
      .header('X-Resource', 'user')
      .setStatusCode(202);
  }
}
```

## Notes

- The plugin is opt-in and only affects routes after registration.
- Register the adapter plugin before applying clear-router routes.
- clear-router `2.4.0` or newer is recommended so direct returns are normalized consistently across adapters.
