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
- `lit/directives/...`: The `directives/` folder contains all of the first-party lit-html directives, like `repeat`, `classMap`, etc.
- `lit/platform-support.js`: A module that connected Lit to the web components polyfills.
