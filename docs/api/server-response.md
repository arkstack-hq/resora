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

## Promise Support

```ts
await resource.response().setStatusCode(201);
```

The body is automatically sent if the underlying response supports `.send()`.
