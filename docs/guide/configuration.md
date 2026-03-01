# Configuration

Resora can be customized using a project-level configuration file.

By default, Resora works without configuration. However, you may create a `resora.config.ts` file in your project root to customize behavior.

```ts
import { defineConfig } from 'resora';
export default defineConfig({
  resourcesDir: 'src/resources',
  stubsDir: 'stubs',
  stubs: {
    resource: 'resource.stub',
    collection: 'collection.stub',
  },
});
```

For simplicity, Resora ships a CLI tool to help with repetitive tasks. To initialize a config file with safe defaults, run the following command in your project root:

::: code-group

```bash [npm]
npm run resora init
```

```bash [pnpm]
pnpm resora init
```

```bash [yarn]
yarn resora init
```

:::

## Config File Location

Resora looks for a configuration file in your project root in the following order:

- `resora.config.ts`
- `resora.config.js`
- `resora.config.cjs`

The first file found will be loaded and merged with the default configuration.

## Basic Example

```ts
// resora.config.ts
import { defineConfig } from 'resora';

export default defineConfig({
  resourcesDir: 'src/http/resources',
  stubsDir: 'stubs/resora',
});
```

JavaScript version:

```js
// resora.config.js
module.exports = {
  resourcesDir: 'src/http/resources',
  stubsDir: 'stubs/resora',
};
```

## How Configuration Is Loaded

At runtime:

1. Resora loads its internal defaults.
2. It checks for a config file in the current working directory.
3. If found, the config is deeply merged with the defaults.
4. User-defined values override defaults.

## Available Configuration Options

### **`resourcesDir`** - _src/resources_

Specifies where generated Resource and Collection classes should be stored.

#### Example

```ts
export default defineConfig({
  resourcesDir: 'app/transformers',
});
```

All generated files will now be placed inside:

```txt
app/transformers
```

### **`stubsDir`** - _Internal Resora stub directory_

Specifies the base directory for stub templates used by the CLI generator.

#### Example

```ts
export default defineConfig({
  stubsDir: 'stubs',
});
```

Resora will now resolve stub templates from:

```txt
stubs/
```

### **`stubs`** - _Default stub file names_

Allows overriding specific stub files.

#### Example

```ts
export default defineConfig({
  stubs: {
    resource: 'resource.stub',
    collection: 'collection.stub',
  },
});
```

Stub resolution will now look inside:

```txt
<stubsDir>/<stub file name>
```

#### Custom Stub Example

You can fully customize how generated resources look by overriding the stub templates.

Example directory:

```txt
stubs/
  resource.stub
  collection.stub
```

Inside `resource.stub`:

```ts
import { Resource } from 'resora'

export default class {{ResourceName}} extends Resource {
  data () {
    return this.toArray()
  }
}
```

The CLI will replace:

- <span v-pre>`{{ResourceName}}`</span>
- <span v-pre>`{{CollectionResourceName}}`</span>
- <span v-pre>`{{collects = Resource}}`</span>
- <span v-pre>`{{import = Resource}}`</span>

### **`preferredCase`** - _`camel`_

Controls key casing for serialized resource payloads.

Supported values:

- `camel`
- `snake`
- `pascal`
- `kebab`
- Custom transformer `(key: string) => string`

#### Example

```ts
export default defineConfig({
  preferredCase: 'snake',
});
```

If your resource returns:

```json
{ "firstName": "John", "lastName": "Doe" }
```

Response payload becomes:

```json
{ "first_name": "John", "last_name": "Doe" }
```

#### Custom transformer

```ts
export default defineConfig({
  preferredCase: (key) => key.toUpperCase(),
});
```

### **`responseStructure`** - _`{ rootKey: 'data', wrap: true }`_

Customizes the JSON envelope used for serialized responses.

Supported options:

- `wrap`: enable/disable payload wrapping
- `rootKey`: rename wrapper key (`data` to `payload`, etc.)
- `factory`: fully custom response builder

#### Disable wrapping

```ts
export default defineConfig({
  responseStructure: {
    wrap: false,
  },
});
```

For plain object payloads, the outer `data` envelope is removed.

When metadata exists on non-object payloads (for example arrays with pagination meta), Resora keeps a wrapped object to preserve `meta`.

#### Custom root key

```ts
export default defineConfig({
  responseStructure: {
    rootKey: 'payload',
  },
});
```

Response becomes:

```json
{
  "payload": { ... }
}
```

#### Custom response factory

```ts
export default defineConfig({
  responseStructure: {
    factory: (payload, context) => ({
      success: true,
      type: context.type,
      result: payload,
    }),
  },
});
```

`context` includes:

- `type`: `resource`, `collection`, or `generic`
- `rootKey`: resolved wrapper key
- `resource`: original input resource
- `meta`: resolved metadata (if any)

### **`paginatedExtras`** - _`['meta', 'links']`_

Controls which pagination/cursor blocks are attached at the response root.

You can use:

- an array of built-ins (`meta`, `links`, `cursor`)
- or custom output keys via object syntax.

#### Example (custom root keys)

```ts
export default defineConfig({
  paginatedExtras: {
    meta: 'meta',
    links: 'navigation',
    cursor: 'cursor_info',
  },
});
```

### **`baseUrl`** - _`https://localhost`_

Base URL used to build absolute pagination link URLs.

### **`pageName`** - _`page`_

Query parameter used when generating pagination links.

#### Example (link URL generation)

```ts
export default defineConfig({
  baseUrl: 'https://api.example.com/v1',
  pageName: 'p',
});
```

With a resource pagination payload like:

```json
{
  "pagination": {
    "firstPage": 1,
    "nextPage": 3,
    "path": "/users"
  }
}
```

Generated links become:

```json
{
  "links": {
    "first": "https://api.example.com/v1/users?p=1",
    "next": "https://api.example.com/v1/users?p=3"
  }
}
```

### **`paginatedMeta`** - _Default pagination field map_

Renames metadata fields emitted for pagination info.

Default source keys:

- `to`
- `from`
- `links`
- `path`
- `total`
- `per_page`
- `last_page`
- `current_page`

### **`paginatedLinks`** - _Default link field map_

Renames pagination link keys.

Supported source keys:

- `first`
- `last`
- `prev`
- `next`

### **`cursorMeta`** - _`{ previous: 'previous', next: 'next' }`_

Renames cursor metadata keys.

#### Example (cursor mapping)

```ts
export default defineConfig({
  paginatedExtras: {
    meta: 'meta',
    cursor: 'cursor',
  },
  cursorMeta: {
    previous: 'before',
    next: 'after',
  },
});
```

Cursor output becomes:

```json
{
  "cursor": {
    "before": "cursor_prev",
    "after": "cursor_next"
  }
}
```

## When Configuration Is Useful

Use configuration when:

- You follow a specific folder structure
- You want fully customized resource templates
- You are integrating Resora into a larger framework
- You want consistency across multiple teams

---

## No Configuration Required

If no config file is found:

- Default directories are used
- Default stub templates are used
- CLI generation still works

Resora is zero-config by default, but configurable when needed.
