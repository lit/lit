# Changelog

## 2.0.0

### Major Changes

- [#3850](https://github.com/lit/lit/pull/3850) [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df) - Remove transform for deprecated usage of queryAssignedNodes.

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0, which includes breaking changes to the TypeScript compiler APIs

## 2.0.0-pre.1

### Major Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

## 2.0.0-pre.0

### Major Changes

- [#3850](https://github.com/lit/lit/pull/3850) [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df) - Remove transform for deprecated usage of queryAssignedNodes.

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript 5.0, which includes breaking changes to the TypeScript compiler APIs.

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

## 1.1.3

### Patch Changes

- [#3116](https://github.com/lit/lit/pull/3116) [`7d185b4e`](https://github.com/lit/lit/commit/7d185b4e882aeca70c7b750d8295d0da34a09cd8) - Upgraded TypeScript version to ~4.7.4

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Upgrade ts-clone-node dependency

## 1.1.2

### Patch Changes

- [#3092](https://github.com/lit/lit/pull/3092) [`0c9ee0ec`](https://github.com/lit/lit/commit/0c9ee0ec87b831513f04bdd37e9ed434a134f06f) - Dependencies pinned due to breaking changes.

## 1.1.1

### Patch Changes

- [#2780](https://github.com/lit/lit/pull/2780) [`0f3a87b8`](https://github.com/lit/lit/commit/0f3a87b83ccf32a997208ca8328a8a3fbbafe955) - Fix reactive prop support for getters

## 1.1.0

### Minor Changes

- [#2327](https://github.com/lit/lit/pull/2327) [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db) - Add `queryAssignedElements` decorator for a declarative API that calls `HTMLSlotElement.assignedElements()` on a specified slot. `selector` option allows filtering returned elements with a CSS selector.

### Patch Changes

- [#2338](https://github.com/lit/lit/pull/2338) [`26e3fb7b`](https://github.com/lit/lit/commit/26e3fb7ba1d3ef778a9862ff73374802b4b4eb2e) - Deprecate `@queryAssignedNodes` API in preference for the new options object API which
  mirrors the `@queryAssignedElements` API. Update the documentation for both
  `@queryAssignedNodes` and `@queryAssignedElements` to better document the expected
  return type annotation.

## 1.0.2

### Patch Changes

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

* [#2060](https://github.com/lit/lit/pull/2060) [`dddbe0c7`](https://github.com/lit/lit/commit/dddbe0c7627a7c1f750da69c3200d373155b1d74) - Update TypeScript

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

## 1.0.1

### Fixed

- Fixed `Cannot read properties of undefined (reading 'elements')` exception
  that would be thrown if a file imported a Lit decorator, and also included a
  default import from any package.

## 1.0.0

- Initial release of `@lit/ts-transformers`.
