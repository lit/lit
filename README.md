# Lit

[![Build Status](https://github.com/Polymer/lit-html/actions/workflows/tests.yml/badge.svg)](https://github.com/Polymer/lit-html/actions/workflows/tests.yml)
[![Published on npm](https://img.shields.io/npm/v/lit.svg?logo=npm)](https://www.npmjs.com/package/lit)
[![Join our Slack](https://img.shields.io/badge/slack-join%20chat-4a154b.svg?logo=slack)](https://www.polymer-project.org/slack-invite)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

## Simple. Fast. Web Components.

Lit is a simple library for building fast, lightweight web components.

At its core is a boilerplate-killing component base class that provides reactive state, scoped styles, and a declarative template system that leads the pack in size, speed, and expressiveness.

### Documentation

To learn more and get started using Lit, check out the [About Lit 2.0](https://github.com/Polymer/lit-html/wiki/About-Lit-2.0). For information about upgrading lit-html 1.x and lit-element 2.x code, see [Lit 2.0 Upgrade Guide](https://github.com/Polymer/lit-html/wiki/Lit-2.0-Upgrade-Guide).

To install from npm:

```sh
npm i lit
```

## Lit Monorepo

This is the monorepo for upcoming Lit packages, including `lit`, `lit-html` 2.0 and `lit-element` 3.0.

lit-html 1.x source is available on the [`lit-html-1.x`](https://github.com/Polymer/lit-html/tree/lit-html-1.x) branch.

### Packages

- Core packages
  - [`lit`](./packages/lit) - The primary user-facing package of Lit which includes everything from lit-html and lit-element.
  - [`lit-element`](./packages/lit-element) - The web component base class used in Lit.
  - [`lit-html`](./packages/lit-html) - The rendering library used by LitElement.
  - [`@lit/reactive-element`](./packages/reactive-element) - A low level base class that provides a reactive lifecycle based on attribute/property changes.
- Additional libraries
  - [`@lit/localize`](./packages/localize) - A library and command-line tool for localizing web applications built using Lit.
  - [`@lit/localize-tools`](./packages/localize) - Localization tooling for use with `@lit/localize`.
- Labs
  - [`@lit-labs/ssr`](./packages/labs/ssr) - A server package for rendering Lit templates and components on the server.
  - [`@lit-labs/ssr-client`](./packages/labs/ssr-client) - A set of client-side support modules for rendering Lit components and templates on the server using `@lit-labs/ssr`.
  - [`@lit-labs/react`](./packages/labs/react) - A React component wrapper for web components.
  - [`@lit-labs/task`](./packages/labs/task) - A controller for Lit that renders asynchronous tasks.
  - [`@lit-labs/scoped-registry-mixin`](./packages/labs/scoped-registry-mixin) - A mixin for LitElement that integrates with the speculative Scoped CustomElementRegistry polyfill.
- Starter kits (not published to npm)
  - [`lit-starter-ts`](./packages/lit-starter-ts) ([template repo](https://github.com/PolymerLabs/lit-element-starter-ts/tree/lit-next)) - A starter repo for building reusable components using Lit in TypeScript.
  - [`lit-starter-js`](./packages/lit-starter-js) ([template repo](https://github.com/PolymerLabs/lit-element-starter-js/tree/lit-next)) - A starter repo for building reusable components using Lit in Javascript.
- Internal packages (not published to npm)
  - [`tests`](./packages/tests) - Test infrastructure for the monorepo.
  - [`benchmarks`](./packages/benchmarks) - Benchmarks for testing various libraries in the monorepo.
  - [`internal-scripts`](./packages/internal-scripts) - Utility scripts used within the monorepo.

## Contributing to Lit

Lit is open source and we appreciate issue reports and pull requests. See [CONTRIBUTING.md](./contributing.md) for more information.

### Setting up the lit monorepo for development

Initialize repo:

```sh
git clone https://github.com/Polymer/lit-html.git
cd lit-html
npm install
npm run bootstrap
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

### Exporting starter templates

Although we maintain `lit-starter-ts` and `lit-starter-js` in
the monorepo for ease of integration testing, the source is exported back out to
individual repos ([ts](https://github.com/PolymerLabs/lit-element-starter-ts),
[js](https://github.com/PolymerLabs/lit-element-starter-js)) as these are
[GitHub Template Repositories](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/creating-a-template-repository)
with a nice workflow for users to create their own new element repos based on
the template.

Use the following command to export new commits to the monorepo packages to a
branch on the template repos (`lit-next` branch shown in example):

```sh
# Export TS template
git remote add lit-element-starter-ts git@github.com:PolymerLabs/lit-element-starter-ts.git
git subtree push --prefix=packages/lit-starter-ts/ lit-starter-element-ts lit-next

# Export JS template
git remote add lit-element-starter-js git@github.com:PolymerLabs/lit-starter-js.git
git subtree push --prefix=packages/lit-starter-js/ lit-starter-element-js lit-next
```

Notes:

- If your version of git did not come with `git-subtree`, you can add it by cloning the git source at `git@github.com:git/git.git` and symlinking `git/contrib/subtree/git-subtree` into your path (e.g. `/usr/local/bin`)
- If `git subtree` errors with a segmentation fault, try increasing your stack size prior to running, e.g. `ulimit -s 16384`
