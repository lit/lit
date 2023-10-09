<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./packages/lit/logo-dark.svg" alt="Lit" width="300" height="141">
  </source>
  <source media="(prefers-color-scheme: light)" srcset="./packages/lit/logo.svg" alt="Lit" width="300" height="141">
  </source>
  <img src="./packages/lit/logo.svg" alt="Lit" width="300" height="141">
</picture>

### Simple. Fast. Web Components.

[![Build Status](https://github.com/lit/lit/actions/workflows/tests.yml/badge.svg)](https://github.com/lit/lit/actions/workflows/tests.yml)
[![Published on npm](https://img.shields.io/npm/v/lit.svg?logo=npm)](https://www.npmjs.com/package/lit)
[![Join our Discord](https://img.shields.io/badge/discord-join%20chat-5865F2.svg?logo=discord&logoColor=fff)](https://lit.dev/discord/)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

</div>

Lit is a simple library for building fast, lightweight web components.

At Lit's core is a boilerplate-killing component base class that provides reactive state, scoped styles, and a declarative template system that's tiny, fast and expressive.

### Documentation

See the full documentation for Lit at [lit.dev](https://lit.dev).

For information about upgrading lit-html 1.x and lit-element 2.x code, see the [Lit 2.0 Upgrade Guide](https://lit.dev/docs/releases/upgrade/).

### npm

To install from npm:

```sh
npm i lit
```

## Lit Monorepo

This is the monorepo for upcoming Lit packages, including `lit`, `lit-html` 2.0 and `lit-element` 3.0.

lit-html 1.x source is available on the [`lit-html-1.x`](https://github.com/lit/lit/tree/lit-html-1.x) branch.

### Packages

- Core packages
  - [`lit`](./packages/lit) - The primary user-facing package of Lit which includes everything from lit-html and lit-element.
  - [`lit-element`](./packages/lit-element) - The web component base class used in Lit.
  - [`lit-html`](./packages/lit-html) - The rendering library used by LitElement.
  - [`@lit/reactive-element`](./packages/reactive-element) - A low level base class that provides a reactive lifecycle based on attribute/property changes.
- Additional libraries
  - [`@lit/localize`](./packages/localize) - A library and command-line tool for localizing web applications built using Lit.
  - [`@lit/localize-tools`](./packages/localize-tools) - Localization tooling for use with `@lit/localize`.
  - [`@lit/react`](./packages/react) - A React component wrapper for web components.
  - [`@lit/task`](./packages/task) - A controller for Lit that renders asynchronous tasks.
  - [`@lit/context`](./packages/context) - A system for passing data through a tree of elements using browser events, avoiding the need to pass properties down every layer of the tree using [a community defined protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).
- Labs
  - [`@lit-labs/ssr`](./packages/labs/ssr) - A server package for rendering Lit templates and components on the server.
  - [`@lit-labs/ssr-client`](./packages/labs/ssr-client) - A set of client-side support modules for rendering Lit components and templates on the server using `@lit-labs/ssr`.
  - [`@lit-labs/eleventy-plugin-lit`](./packages/labs/eleventy-plugin-lit) - A plugin for Eleventy that pre-renders
    Lit components using `@lit-labs/ssr` with optional hydration.
  - [`@lit-labs/router`](./packages/labs/router) - A router for Lit.
  - [`@lit-labs/motion`](./packages/labs/motion) - Lit directives for making things move
  - [`@lit-labs/scoped-registry-mixin`](./packages/labs/scoped-registry-mixin) - A mixin for LitElement that integrates with the speculative Scoped CustomElementRegistry polyfill.
- Starter kits (not published to npm)
  - [`lit-starter-ts`](./packages/lit-starter-ts) ([template
    repo](https://github.com/lit/lit-element-starter-ts)) - A starter repo for building reusable components using Lit in TypeScript.
  - [`lit-starter-js`](./packages/lit-starter-js) ([template
    repo](https://github.com/lit/lit-element-starter-js)) - A starter repo for building reusable components using Lit in JavaScript.
- Internal packages (not published to npm)
  - [`tests`](./packages/tests) - Test infrastructure for the monorepo.
  - [`benchmarks`](./packages/benchmarks) - Benchmarks for testing various libraries in the monorepo.
  - [`@lit-internal/scripts`](./packages/@lit-internal/scripts) - Utility scripts used within the monorepo.

## Contributing to Lit

Lit is open source and we appreciate issue reports and pull requests. See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

### Setting up the lit monorepo for development

Initialize repo:

```sh
git clone https://github.com/lit/lit.git
cd lit
npm ci
```

Build all packages:

```sh
npm run build
```

Test all packages:

```sh
npm run test
```

Run benchmarks for all packages:

```sh
npm run benchmarks
```

See individual package READMEs for details on developing for a specific package.
