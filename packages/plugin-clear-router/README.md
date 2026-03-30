# @resora/plugin-clear-router

Opt-in bridge plugins for using `resora` resources inside `clear-router` routes and controller handlers without changing either core package.

## Why

`resora` resources are thenables, while `clear-router` resolves returned values from both inline handlers and controller actions. Registering these plugins lets Resora bind the active clear-router request context before the handler runs, so plain `return new Resource(...)` works for direct callbacks and controller methods.

## Usage

```ts
import { registerPlugin } from 'resora';
import { clearRouterExpressPlugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterExpressPlugin);
```

```ts
import { Router, Controller } from 'clear-router';
import { Resource } from 'resora';

class UserController extends Controller {
  index() {
    return new Resource({ id: 1, name: 'Ada' });
  }
}

Router.get('/users', [UserController, 'index']);
```

```ts
import { registerPlugin } from 'resora';
import { clearRouterH3Plugin } from '@resora/plugin-clear-router';

registerPlugin(clearRouterH3Plugin);
```

## Exports

- `clearRouterExpressPlugin`
- `clearRouterH3Plugin`
- `clearRouterPlugin`
