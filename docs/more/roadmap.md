# Roadmap

The following features are planned to expand Resora’s flexibility and production readiness.

## Case Customization

Allow configurable key casing strategies:

- snake_case
- camelCase
- PascalCase
- custom transformers

This enables seamless integration with legacy APIs or strict backend standards.

✅ Implemented

## Customizing Response Structure

Provide configuration to redefine the default JSON envelope.

Current default:

```json
{
    "data": ...
}
```

Planned support:

- Custom root key
- Fully custom response factory
- Global or per-resource configuration

✅ Implemented

## Customizing and Adding Metadata

Introduce structured metadata customization via a `with()` method on resource and collection classes

Support both:

- Pagination metadata
- Cursor metadata
- Custom metadata blocks

Allow developers to append structured meta without manual merging.

✅ Implemented

## Customizing Outgoing Response

Introduce a `withResponse()` method on custom resource and collection classes.

This will allow on per classes bases:

- Direct access to response object
- Advanced header manipulation
- Framework-specific integrations
- Final response mutation before dispatch

✅ Implemented

## Data Wrapping Configuration

Currently, the outermost resource is wrapped in a "data" key by default.

Planned:

- Ability to disable wrapping
- Ability to rename wrapping key
- Per-resource wrapping configuration

✅ Implemented

## Conditional Attributes

Add conditional transformation helpers:

- `this.when(condition, value | () => value)`
- `this.whenNotNull(value)`
- `this.mergeWhen(condition, object | () => object)`

✅ Implemented

## NextJs API, NestJS and Fastify Support

Add direct support for NextJs API, NestJS, and Fastify response objects in:

- `withResponse()` hooks
- `.response()` dispatch flow
- `ServerResponse` adapter handling

This will enable first-class integration without requiring custom wrappers.

🔲 Implemented

## Plugin System

Introduce a first-class plugin architecture to extend Resora without modifying core behavior.

The plugin system will allow developers to:

- Hook into the transformation lifecycle
- Modify outgoing payloads
- Inject global behaviors
- Extend metadata handling
- Register reusable transformation utilities

These utilities will enable clean, declarative conditional serialization without verbose logic inside data().

🔲 Implemented
