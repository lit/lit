# @lit-labs/nextjs

## 0.2.2

### Patch Changes

- [#4903](https://github.com/lit/lit/pull/4903) [`6a232e92`](https://github.com/lit/lit/commit/6a232e92af9372892c7a916dd3d25947be674ee0) - Add Lit Labs noticed to README

## 0.2.1

### Patch Changes

- [#4840](https://github.com/lit/lit/pull/4840) [`37c02502`](https://github.com/lit/lit/commit/37c025029a085a4837496b6a4fa7203034c3d16f) Thanks [@kyubisation](https://github.com/kyubisation)! - Fix type of nextjs config wrapper

- [#4815](https://github.com/lit/lit/pull/4815) [`d3ce79a7`](https://github.com/lit/lit/commit/d3ce79a7a7efdbb8645e41810d00eaa09f61251f) Thanks [@JamesIves](https://github.com/JamesIves)! - Adds support for Next.js 15

## 0.2.0

### Minor Changes

- [#4575](https://github.com/lit/lit/pull/4575) [`aa4fc3ef`](https://github.com/lit/lit/commit/aa4fc3eff349b202861e597ef7554934b9eaa19a) - Add support for Next.js 14 and App Router. No longer support Next.js 12.

  Note: By default, components in the App Router are React Server Components (RSCs). Deep SSR of Lit components does **not** work within server components as they result in React hydration mismatch due to the presence of the `<template>` element in the RSC payload containing the serialized server component tree, and the custom element definitions will not be included with the client bundle either when imported in server component files.

  Make sure any Lit components you wish to use are beyond the `'use client';` boundary. These will still be server rendered for the initial page load just like they did for the Pages Router.

### Patch Changes

- Updated dependencies [[`aa4fc3ef`](https://github.com/lit/lit/commit/aa4fc3eff349b202861e597ef7554934b9eaa19a), [`aa4fc3ef`](https://github.com/lit/lit/commit/aa4fc3eff349b202861e597ef7554934b9eaa19a)]:
  - @lit-labs/ssr-react@0.3.0

## 0.1.4

### Patch Changes

- [#4354](https://github.com/lit/lit/pull/4354) [`c8e1509c`](https://github.com/lit/lit/commit/c8e1509c1a86b082061853f56f980c6d1babbefb) - Add plugin option `addDeclarativeShadowDomPolyfill` which, if true, will add a script to the client bundle which will apply the `@webcomponents/template-shadowroot` ponyfill on the document. Note: If you were manually adding the polyfill, you can either remove your own implementation or set this option to `false`.

## 0.1.3

### Patch Changes

- [#4306](https://github.com/lit/lit/pull/4306) [`c28ebba1`](https://github.com/lit/lit/commit/c28ebba15669042144db48563611b2c9bb7a2e47) - Update dependency version to refer to stable versions, rather than pre-release versions of our own packages.

## 0.1.2

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

## 0.1.2-pre.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5)]:
  - @lit-labs/ssr-react@0.2.1-pre.0

## 0.1.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa)]:
  - @lit-labs/ssr-react@0.1.2-pre.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`7932f7dd`](https://github.com/lit/lit/commit/7932f7ddc21308dc0bf7b1bbd0dde781a6c8dece)]:
  - @lit-labs/ssr-react@0.2.0

## 0.1.1

### Patch Changes

- [#3748](https://github.com/lit/lit/pull/3748) [`3cea6b2d`](https://github.com/lit/lit/commit/3cea6b2d23f294d41c57f8e695575468cc068332) - Fix README title

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - Use hydration modules from `@lit-labs/ssr-client`

## 0.1.0

### Minor Changes

- [#3613](https://github.com/lit/lit/pull/3613) [`be182929`](https://github.com/lit/lit/commit/be18292938062a3b5233016fdac1a72ba6f1eacf) - Initial release of `@lit-labs/nextjs` package.

  This package contains a plugin for Next.js that enables deep server rendering of Lit components.

### Patch Changes

- Updated dependencies [[`b731bb5e`](https://github.com/lit/lit/commit/b731bb5e6d07af2e0ca2de911b781fa3794231cd)]:
  - @lit-labs/ssr-react@0.1.0
