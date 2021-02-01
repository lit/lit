# Lit 2.0

Fast, lightweight web components

## About this package

The `lit` package contains everything needed to build Lit components with the LitElement base class, lit-html templates, and all first-party lit-html directives.

Modules:

- `lit`: The main module exports the core pieces needed for component development: `LitElement`, `html`, `css`, and the most
- `lit/decorators.js`: Exports all the TypeScript/Babel decorators from one module.
- `lit/decorators/...`: The `decorators/` folder contains a module for each decorator (`@customElement()`, `@property()`, etc.) for optimal pay-as-you-go module loading.
- `lit/html.js`: Just the exports needed for standalone `lit-html` usage: `render()`, `html`, `svg`, etc.
- `lit/static-html.js`: The lit-html `static.js` module
- `lit/directives.js`: Contains the `Directive` base class for implementing directives.
- `lit/directive-helpers.js`: Optional helper utilities for implementing directives.
- `lit/async-directive.js`: A directive base class that supports disconnection and reconnection.
- `lit/directives/...`: The `directives/` folder contains all of the first-party lit-html directives, like `repeat`, `classMap`, etc.
- `lit/polyfill-support.js`: A module that connects Lit to the web components polyfills where necessary to support older browsers.
- `lit/hydrate-support.js`: A module that add hydration support to LitElement.
