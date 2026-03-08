# Changelog

All notable changes to Resora will be documented in this file.

The format follows semantic versioning principles.

## [Unreleased] - Upcoming features and changes that are currently in development or planned for the next release.

### Planned

- Plugin System for lifecycle extension without core modification
- Direct support for Next.Js API, Nest.JS, and Fastify response objects in `withResponse()`, `.response()`, and `ServerResponse` class.
- Built-in support for Arkormˣ models for seamless transformation of Arkormˣ entities.

## [0.2.1] - [0.2.2] - Patch Release Series

### Changed

- API serialization internals now support runtime configuration loading so API usage can honor `resora.config.*`, not only CLI workflows.
- Runtime config resolution now normalizes through `defineConfig()` for consistent merge behavior across CLI and runtime paths.
- Moved configuration-focused assertions out of core serializer tests into a dedicated `config.spec.ts` suite for clearer test boundaries.
- Improve metadata handling and response structure in utilities to support new configuration-driven features.

### Added

- Added runtime config test reset helper to improve deterministic testing of config load/apply behavior.
- Added dedicated configuration scenario coverage for config merging, runtime config application, and file-based runtime loading.
- Enhanced configuration options in types and utilities for better flexibility

### Documentation

- Updated changelog and docs references to reflect runtime config support in API runtime scenarios.

## [0.2.0] - Major Release

### Changed

- Refactored internals by splitting monolithic `types.ts` and `utility.ts` concerns into dedicated modules under `src/types/*` and `src/utilities/*`.
- Updated tests and examples to use `.getBody()` instead of direct `.json().body` access.
- Serializer `body` state is now private in core resource classes.

### Added

- Added `getBody()` to `Resource`, `ResourceCollection`, and `GenericResource` as the standard way to retrieve serialized output.
- Added protected `setBody()` helper for controlled body mutation inside custom class hooks (for example `withResponse()`).
- Case customization strategies with global and per-class support (`camel`, `snake`, `pascal`, `kebab`, and custom transformers).
- Custom response structure configuration via `responseStructure` with custom root key and full response factory support.
- Metadata customization APIs:
  - `with()` class hook
  - `withMeta()` typed fluent helper
  - deep metadata merge behavior preserving pagination/cursor defaults.
- `withResponse()` outgoing transport hook for per-class final response mutation (headers, status, and body) before dispatch.
- Data wrapping configuration via `responseStructure.wrap` (global and per-class override support).
- Pagination output configuration:
  - absolute pagination links via `baseUrl` + `pageName`
  - configurable pagination extras via `paginatedExtras` (including `cursor`)
  - configurable pagination key maps via `paginatedMeta`, `paginatedLinks`, and `cursorMeta`.
- Conditional attribute helpers for declarative serialization in `data()`:
  - `this.when(condition, value | () => value)`
  - `this.whenNotNull(value)`
  - `this.mergeWhen(condition, object | () => object)`

### Documentation

- Added dedicated guide for non-Connect frameworks: `Using Resora Outside H3/Express (Non-Connect Frameworks)`.
- Added cross-links from `Server Response` and `Getting Started` to the non-Connect usage guide.
- Updated guide examples to use `.getBody()` and `setBody()` patterns.
- Added configuration docs for `preferredCase` and `responseStructure` with examples.
- Added writing guide coverage for `withResponse()` and hook context (`withResponseContext`).
- Added cross-links in resources and collections guides for case, envelope, metadata, and outgoing response customization.
- Added configuration guide coverage for pagination URL generation and cursor metadata customization.
- Added guide coverage for conditional attribute helper usage in custom resources.

## [0.1.3] - [0.1.6] - Patch Releases

### Added

- Refactored CLI structure and added initialization command
- Enable minification in CLI build configuration

### Fixed

- General code cleanup and refactoring for improved maintainability
- Updated documentation to reflect CLI changes and new features

## [0.1.2] - Patch Release

### Fixed

- Refactored CLI initialization to use `baseCommands` to register commands as intended.

## [0.1.1] - Patch Release

### Changed

- Enhanced documentation for configuration and resource generation processes.
- Updated types to reflect new resource definitions and added metadata types.

### Added

- Introduced a CLI application for generating `Resource` and `ResourceCollection` classes.
- Added commands for creating single resources, collections, and both simultaneously.
- Implemented configuration file support for customizing behavior.
- Created stubs for resource and collection classes to streamline generation.

## [0.1.0] - Initial Release

### Added

- Automatic pagination extraction
- Automatic cursor extraction
- Structured JSON envelope
- Chainable transformation API
- `.response()` transport binding
- Header, cookie, and status support
- Awaitable resource instances
- Introduced `GenericResource` for single resources, collections, and pagination support.
- Added `ResourceCollection` for transforming resource collections with pagination and cursor metadata.
- Implemented base `Resource` class for single resource transformation with additional properties support.
- Created `ServerResponse` class for handling HTTP response in connect-style frameworks (Express) and H3.
- Developed comprehensive documentation for API usage, including guides for getting started and writing resources.
- Established a structured changelog and roadmap for future enhancements.

Initial stable foundation for structured API response handling.
