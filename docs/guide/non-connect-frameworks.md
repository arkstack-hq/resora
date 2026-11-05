# Using Resora Outside H3/Express/Fastify (Non-Connect Frameworks)

Resora works as a pure transformation layer, even when your framework does **not** expose a Connect-style response object.

In these frameworks, use Resora to build a JSON-safe payload or a complete
response snapshot, then return or send it with your framework's native response
API.

## Core Pattern

```ts
import { Resource } from 'resora';

const body = new Resource(user).getBody();

// send `body` using your framework's response mechanism
```

This approach works everywhere because it does not rely on `.response()` transport binding.

## Status And Headers

Use `toResponseData()` when the adapter needs Resora's body, status, and headers:

```ts
const response = new Resource(user)
  .response()
  .setStatusCode(201)
  .setHeaders({
    'X-Resource': 'user',
  })
  .toResponseData();

return framework.send({
  body: response.body,
  status: response.status,
  headers: response.headers,
});
```

The snapshot is a plain object rather than a thenable. This makes it safe to
return from async controller and adapter code without losing status or header
metadata.

## Why this works

Resora separates:

- **Transformation**: resource shape, metadata, conditional attributes
- **Transport**: headers/status/cookies at framework response layer

When Connect-style response objects are unavailable, keep transport in your framework and use Resora for transformation only.

## Fastify

Resora dispatches through a Fastify `reply` directly. Pass the reply to the
resource (or to `.response()`), then return the reply so Fastify knows the
response has been sent:

```ts
import { Resource } from 'resora';

fastify.get('/users/:id', async (request, reply) => {
  const user = await findUser(request.params.id);

  await new Resource(user, reply)
    .withMeta({ traceId: request.id })
    .response()
    .setStatusCode(200)
    .header('X-Resource', 'user');

  return reply;
});
```

A `{ req, reply }` context, as clear-router's Fastify adapter provides, works
the same way. With clear-router, the `clearRouterFastifyPlugin` from
`@resora/plugin-clear-router` returns the reply for you.

To keep Fastify in charge of sending, return the body instead:

```ts
fastify.get('/users/:id', async (request) => {
  return new Resource(await findUser(request.params.id)).getBody();
});
```

## Next.js

### Pages Router API routes

Resora dispatches through the API route's `res` directly:

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resource } from 'resora';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await findUser(req.query.id);

  await new Resource(user, { req, res })
    .response()
    .setStatusCode(200)
    .header('X-Resource', 'user');
}
```

Passing `{ req, res }` also gives Resora the request path for pagination links.

### App Router route handlers

Route handlers return a Web `Response`, so build one with `toWebResponse()`:

```ts
import { Resource } from 'resora';

export async function GET(request: Request) {
  const user = await findUser(new URL(request.url).searchParams.get('id'));

  return new Resource(user)
    .response()
    .setStatusCode(200)
    .header('X-Resource', 'user')
    .toWebResponse();
}
```

## NestJS

NestJS hands controllers the platform's own response: an Express `res` or a
Fastify `reply`. Resora dispatches through either one.

### Return value style

Let Nest send the response and return the transformed body:

```ts
import { Resource } from 'resora'

@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.usersService.findOne(id)

  return new Resource(user)
    .withMeta({ source: 'users-controller' })
    .getBody()
}
```

### `@Res()` style

Inject the response with `@Res()` and let Resora send it:

```ts
import { Resource } from 'resora'

@Get(':id')
async findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
  const user = await this.usersService.findOne(id)

  await new Resource(user, { req, res })
    .response()
    .setStatusCode(200)
    .header('X-Resource', 'user')
}
```

With the Fastify platform, pass `{ req, reply }` instead.

### `ArgumentsHost` and `ExecutionContext`

Interceptors, guards and exception filters receive an `ArgumentsHost` or an
`ExecutionContext`. Resora accepts either one in place of a response or a
`{ req, res }` context, and reads the request and response from
`switchToHttp()`:

```ts
import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common'
import { GenericResource } from 'resora'

@Catch(NotFoundException)
export class NotFoundFilter implements ExceptionFilter {
  async catch(exception: NotFoundException, host: ArgumentsHost) {
    await new GenericResource({ message: exception.message })
      .response(host)
      .setStatusCode(404)
  }
}
```

A host can also be passed to the constructor or to `Resource.setCtx()`.

## Collections and Pagination in Non-Connect Frameworks

```ts
import { ResourceCollection } from 'resora';

const body = new ResourceCollection({
  data: users,
  pagination: {
    currentPage: 1,
    lastPage: 10,
    total: 100,
    perPage: 10,
    path: '/users',
  },
}).getBody();
```

Then send `body` with your framework's normal response API.

## Conditional Attributes Still Work

```ts
class UserResource extends Resource {
  data() {
    return {
      id: this.id,
      email: this.whenNotNull(this.email),
      role: this.when(this.isAdmin, 'admin'),
    };
  }
}
```

All conditional helpers work the same because they are transformation features, not transport features.

## Choosing The Integration Style

- Use `.getBody()` when only the transformed JSON payload is needed.
- Use `.response().toResponseData()` when status or headers should travel with
  the payload.
- Use `.response(rawResponse)` or await the response when Resora should dispatch
  directly through a supported mutable response object.
