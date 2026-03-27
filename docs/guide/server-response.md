# Server Response (`.response()`)

The `.response()` method binds a `Resource` or `ResourceCollection` instance to a framework response object, enabling HTTP-layer control while preserving Resora’s structured output contract.

Once bound, the instance exposes transport-aware methods for mutating the outgoing response.

## Method Signature

**`.response(res?)`**

Binds the internal Resource instance to a framework-specific response object.

### Parameters

- `res`
  The framework’s native response object (e.g., H3 `res`, Express `res`) or a full context object containing `{ req, res }`.

  > For Express and other frameworks implementing the connect-style middleware, this can be skipped, in which case Resora will use the response object provided in the `Resource` or `ResourceCollection` constructor.
  >
  > The constructor accepts either a bare response object or a full `{ req, res }` context. When a context is passed, Resora also extracts the request URL for [automatic pagination link generation](/guide/pagination-cursor-recipes#url-detection).

### Returns

- The same `Resource` or `ResourceCollection` instance (chainable).

## Available Transport Methods After Binding

These methods become active only after `.response(res)` has been called.

### `header(name, value)`

Sets a response header.

#### Parameters

- `name` — Header name (string)
- `value` — Header value (string)

#### Behavior

- Delegates to the framework’s native header setter
- Does not mutate the internal `data`
- Chainable

#### Example Behavior

If called:

- The header will be present in the final HTTP response
- JSON structure remains unchanged

### `setStatusCode(code)`

Sets the HTTP status code for the response.

#### Parameters

- `code` — Numeric HTTP status code (e.g., 200, 201, 404)

#### Behavior

- Applies the status code before body dispatch
- Does not alter the JSON payload
- Chainable

If not called, the framework default status code is used.

### `setCookie(name, value, options?)`

Sets a cookie on the response.

#### Parameters

- `name` — Cookie name (string)
- `value` — Cookie value (string)
- `options` — Optional cookie configuration object

#### Supported Options (Framework-Dependent)

Typical cookie options may include:

- `path`
- `domain`
- `maxAge`
- `expires`
- `httpOnly`
- `secure`
- `sameSite`

Resora passes these options directly to the framework’s native cookie mechanism.

#### Behavior

- Adds a `Set-Cookie` header
- Does not interfere with JSON structure
- Chainable

## Chaining Behavior

All transport methods:

- Return the same Resource instance
- Can be chained in any order
- Preserve internal transformation logic

Example flow (conceptually):

```txt
Resource
  → bind to response
  → set status
  → set headers
  → set cookies
  → return structured JSON
```

## Execution Model

When `.response()` is used:

1. The Resource binds to the framework’s response object
2. Transport modifiers are recorded/applied immediately
3. The JSON body remains managed by Resora
4. The final output structure is still:

```json
{
  data: ...,
  meta?: ...
}
```

Transport state and payload state are intentionally separated.

## Framework Compatibility

`.response()` works with:

- H3 (native Fetch-style)
- Express
- Connect-style middleware frameworks
- Any framework exposing a mutable response object

Resora does not replace the response lifecycle — it integrates into it.

If you're using a framework outside H3/Express or non-Connect response styles, use the transformation-first pattern documented in [Using Resora Outside H3/Express (Non-Connect Frameworks)](./non-connect-frameworks.md).

## If `.response()` Is Not Used

- The Resource acts as a pure transformation layer
- It remains awaitable
- It resolves to a JSON-ready object
- No headers, cookies, or status manipulation is available

## Design Contract

`.response()` guarantees:

- Consistent JSON envelope
- Explicit transport control
- No implicit mutation of resource data
- Full chainability
- Separation between transformation and HTTP mechanics
