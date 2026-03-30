# Plugin System API

The Resora plugin system provides a small registration API for lifecycle hooks, context helpers, and reusable utilities.

## Exports

Core plugin APIs exposed by `resora`:

- `registerPlugin(plugin | plugin[])`
- `definePlugin(plugin)`
- `getRegisteredPlugins()`
- `getUtility(name)`

Additional testing and internal support APIs:

- `resetPluginsForTests()`

## `registerPlugin(plugin | plugin[])`

Registers one or more plugins.

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

### Parameters

- `plugin | plugin[]`
  A single plugin object or an array of plugin objects.

### Behavior

- Plugins are identified by `name`.
- Duplicate registrations of the same plugin name are ignored.
- If a plugin provides `setup(api)`, it runs once during registration.

### Returns

- An array of currently registered plugins.

## `definePlugin(plugin)`

Creates a typed plugin definition.

```ts
import { definePlugin } from 'resora';

export const myPlugin = definePlugin({
  name: 'my-plugin',
  afterSerialize(event) {
    event.body = {
      ...event.body,
      meta: {
        addedByPlugin: true,
      },
    };
  },
});
```

This helper mainly improves typing and discoverability. It does not alter runtime behavior.

## `getRegisteredPlugins()`

Returns all currently registered plugins.

```ts
import { getRegisteredPlugins } from 'resora';

const plugins = getRegisteredPlugins();
```

## `getUtility(name)`

Retrieves a reusable utility previously registered by a plugin.

```ts
import { getUtility } from 'resora';

const greeting = getUtility<(name: string) => string>('greeting');
```

### Returns

- The registered utility function
- `undefined` if no utility exists for that name

## Plugin Shape

A plugin is an object with a unique `name` and optional lifecycle hooks.

```ts
type ResoraPlugin = {
  name: string;
  setup?: (api) => void;
  beforeSerialize?: (event, api) => void;
  afterSerialize?: (event, api) => void;
  beforeResponse?: (event, api) => void;
  afterResponse?: (event, api) => void;
  beforeSend?: (event, api) => void;
  afterSend?: (event, api) => void;
};
```

## Plugin API Available To `setup()` And Hooks

Hooks receive a plugin API object with the following helpers:

- `runWithCtx(ctx, callback)`
- `setCtx(ctx)`
- `getCtx()`
- `registerUtility(name, utility)`
- `getUtility(name)`
- `getRegisteredPlugins()`

### `runWithCtx(ctx, callback)`

Runs a callback inside a request-scoped context.

This is primarily useful for framework integrations that need Resora's request context to remain active through returned thenables or deferred response dispatch.

### `setCtx(ctx)` / `getCtx()`

Manually set or read the current request context.

These are lower-level helpers. Prefer `runWithCtx()` for request-bound integrations.

### `registerUtility(name, utility)`

Registers a utility function that other plugins or application code can retrieve later.

## Hook Event Shapes

### Serialization Hooks

`beforeSerialize` and `afterSerialize` receive:

- `serializer`
- `serializerType`
- `resource`
- `body`

These hooks are best for payload mutation.

### Response Hooks

`beforeResponse` and `afterResponse` receive:

- `serializer`
- `serializerType`
- `rawResponse?`
- `response?`
- `body`

These hooks are best for transport-aware behavior after the body has been built.

### Send Hooks

`beforeSend` and `afterSend` receive:

- `response`
- `rawResponse`
- `body`
- `status`
- `headers`

These hooks are best for final transport mutation or inspection.

## Testing Helper

### `resetPluginsForTests()`

Clears the registered plugin and utility registries.

```ts
import { resetPluginsForTests } from 'resora';

resetPluginsForTests();
```

This is intended for test isolation.

## Related Guides

- [Guide: Plugin System](../guide/plugins.md)
- [Guide: Server Response](../guide/server-response.md)
