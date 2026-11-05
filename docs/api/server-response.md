# ServerResponse

Abstracts HTTP response handling for Connect (Express) and H3.

## Constructor

```ts
new ServerResponse(response, body);
```

## Methods

### setStatusCode(status)

```ts
response.setStatusCode(201);
```

### header(key, value)

```ts
response.header('X-App-Version', '1.0.0');
```

### setHeaders(headers)

```ts
response.setHeaders({
  'Cache-Control': 'no-cache',
});
```

### setCookie(name, value, options)

```ts
response.setCookie('token', 'abc123', {
  HttpOnly: true,
  Path: '/',
});
```

### toResponseData()

Returns the finalized response state without dispatching it:

```ts
const data = resource
  .response()
  .setStatusCode(201)
  .setHeaders({ 'X-Resource': 'user' })
  .toResponseData();

// {
//   body: { data: ... },
//   status: 201,
//   statusText?: string,
//   headers: { 'X-Resource': 'user' }
// }
```

The returned `ServerResponseData` object is not thenable. Framework adapters can
use it to apply Resora's body, status, and headers through their native response
API without triggering Resora's automatic dispatch.

`beforeSend` plugin hooks are applied before the snapshot is returned.
`afterSend` hooks remain reserved for actual dispatch through `send()` or
awaiting the `ServerResponse`.

### toWebResponse()

Resolves to a JSON Web `Response` built from the finalized body, status, status
text and headers:

```ts
export async function GET() {
  return new UserResource(await findUser())
    .response()
    .setStatusCode(200)
    .toWebResponse();
}
```

It suits handlers that return a `Response`, such as Next.js App Router route
handlers. `Content-Type` defaults to `application/json` unless a header sets it.
Async `data()` is resolved first, and `beforeSend` plugin hooks run as they do
for `toResponseData()`.

## Promise Support

```ts
await resource.response().setStatusCode(201);
```

The body is automatically sent if the underlying response supports `.send()`.
