# @lit-labs/ssr-dom-shim

## 1.1.2

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

## 1.1.2-pre.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

## 1.1.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

## 1.1.1

### Patch Changes

- [#3793](https://github.com/lit/lit/pull/3793) [`8a11f7ea`](https://github.com/lit/lit/commit/8a11f7ea0964c8d8f055e1a085e3f5b99877dccd) - Warn instead of throwing on repeat custom element registration in development mode.

## 1.1.0

### Minor Changes

- [#3677](https://github.com/lit/lit/pull/3677) [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86) - Add rough support for HTMLElement.prototype.attachInternals

## 1.0.0

### Major Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - When running in Node, Lit now automatically includes minimal DOM shims which are
  sufficient for most SSR (Server Side Rendering) use-cases, removing the need to
  import the global DOM shim from `@lit-labs/ssr`.

  The new `@lit-labs/ssr-dom-shim` package has been introduced, which exports an `HTMLElement`, `CustomElementRegistry`, and default `customElements` singleton.

  The existing `@lit-labs/ssr` global DOM shim can still be used, and is compatible with the new package, because `@lit-labs/ssr` imports from `@lit-labs/ssr-dom-shim`. Importing the global DOM shim adds more APIs to the global object, such as a global `HTMLElement`, `TreeWalker`, `fetch`, and other APIs. It is recommended that users try to remove usage of the `@lit-labs/ssr` DOM shim, and instead rely on the more minimal, automatic shimming that `@lit/reactive-element` now provides automatically.
