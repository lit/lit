# Lit

## Simple. Fast. Web Components.

Lit is a simple library for building fast, lightweight web components.

At Lit's core is a boilerplate-killing component base class that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive.

## About this package

The `lit` package contains everything needed to build Lit components: the LitElement base class, Lit templates, and all first-party Lit directives.

Modules:

- `lit`: The main module exports the core pieces needed for component development, including `LitElement`, `html`, and `css`
- `lit/decorators.js`: Exports all the TypeScript/Babel decorators from one module.
- `lit/decorators/...`: The `decorators/` folder contains a module for each decorator (`@customElement()`, `@property()`, etc.) for optimal pay-as-you-go module loading.
- `lit/html.js`: Just the exports needed for standalone `lit-html` usage: `render()`, `html`, `svg`, etc.
- `lit/static-html.js`: The lit-html `static.js` module
- `lit/directives.js`: Contains the `Directive` base class for implementing directives.
- `lit/directive-helpers.js`: Optional helper utilities for implementing directives.
- `lit/async-directive.js`: A directive base class that supports disconnection and reconnection.
- `lit/directives/...`: The `directives/` folder contains all of the first-party lit-html directives, like `repeat`, `classMap`, etc.
- `lit/polyfill-support.js`: A module that connects Lit to the web components polyfills where necessary to support older browsers.
- `lit/experimental-hydrate.js`: A module for hydrating `lit-html` templates that were server-rendered with `@lit-labs/ssr`. Note this module is experimental and subject to breaking changes.
- `lit/experimental-hydrate-support.js`: A module that adds hydration support to LitElement. Note this module is experimental and subject to breaking changes.
