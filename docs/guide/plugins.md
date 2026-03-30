# Plugin System

Resora exposes a first-class plugin registry for opt-in integrations and lifecycle extensions.

Use plugins when you want to:

- integrate Resora with a framework without changing core behavior
- modify serialized payloads globally
- extend response dispatch behavior
- register reusable serialization utilities

The plugin system is optional. If you do not register any plugins, Resora continues to behave like a normal resource transformation layer.

## Basic Registration

Register a single plugin:

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

Register multiple plugins:

```ts
import { registerPlugin } from 'resora';
import {
  clearRouterExpressPlugin,
  clearRouterH3Plugin,
} from '@resora/plugin-clear-router';

registerPlugin([clearRouterExpressPlugin, clearRouterH3Plugin]);
```

## What Plugins Can Do

Plugins can hook into three parts of Resora's lifecycle:

1. Serialization
2. Response preparation
3. Response sending

This allows a plugin to:

- change the final payload before it is returned
- inspect or mutate outgoing response state
- bind request context for framework integrations
- register shared utilities that resource classes or integrations can consume

## Lifecycle Overview

The current plugin lifecycle is:

```txt
resource/collection created
  -> beforeSerialize
  -> afterSerialize
  -> beforeResponse
  -> afterResponse
  -> beforeSend
  -> afterSend
```

Not every lifecycle stage runs in every usage pattern.

- Pure transformation usage such as `getBody()` only runs the serialization hooks.
- Transport-aware flows such as `.response()` or auto-send paths also run response and send hooks.

## Creating a Plugin

Use `definePlugin()` to create a typed plugin object.

```ts
import { definePlugin } from 'resora';

export const appendMetaPlugin = definePlugin({
  name: 'append-meta',

  afterSerialize(event) {
    event.body = {
      ...event.body,
      meta: {
        ...(event.body.meta || {}),
        plugin: true,
      },
    };
  },
});
```

Then register it:

```ts
import { registerPlugin } from 'resora';
import { appendMetaPlugin } from './append-meta-plugin';

registerPlugin(appendMetaPlugin);
```

## Registering Utilities

Plugins may expose reusable helpers through the plugin API.

```ts
import { definePlugin } from 'resora';

export const namingPlugin = definePlugin({
  name: 'naming-plugin',
  setup(api) {
    api.registerUtility('greeting', (name: string) => `hello ${name}`);
  },
});
```

Utilities can then be retrieved with `getUtility()`.

## Framework Integration Example

The clear-router integration is a good example of what this system is for.

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

After registration, controller actions and inline handlers can return Resora resources directly:

```ts
import { Controller, Router } from 'clear-router';
import { Resource } from 'resora';

class UserController extends Controller {
  index() {
    return new Resource({ id: 1, name: 'Ada' });
  }
}

Router.get('/users', [UserController, 'index']);
```

## Backward Compatibility

The plugin system is opt-in.

- If no plugin is registered, the registry stays empty.
- Empty plugin hooks are no-ops.
- Existing Resource, ResourceCollection, GenericResource, and ServerResponse usage continues to work.

This means packages such as `@resora/plugin-clear-router` do not affect Resora unless they are explicitly registered.

## Related APIs

- [API: Plugin System](../api/plugins.md)
- [Guide: Server Response](./server-response.md)
- [Guide: Non-Connect Frameworks](./non-connect-frameworks.md)
