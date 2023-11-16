# @lit-labs/ssr-client

A set of client-side support modules for rendering Lit components and templates
on the server using `@lit-labs/ssr`.

## Overview

Package contents:

- `directives/render-light.js`: A child-position directive that invokes and
  renders the parent custom element's `renderLight` method as its value.
- `controllers/server-controller.js`: An interface that extends `ReactiveController`, providing a way to run async _server only_ logic during SSR.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
