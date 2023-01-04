---
'@lit-labs/ssr-dom-shim': major
'@lit-labs/ssr': minor
'@lit/reactive-element': minor
'lit-html': minor
'lit': minor
---

When running in Node, Lit now automatically includes minimal DOM shims which are
sufficient for most SSR (Server Side Rendering) use-cases, removing the need to
import the global DOM shim from `@lit-labs/ssr`.

The new `@lit-labs/ssr-dom-shim` package has been introduced, which exports an `HTMLElement`, `CustomElementRegistry`, and default `customElements` singleton.

The existing `@lit-labs/ssr` global DOM shim can still be used, and is compatible with the new package, because `@lit-labs/ssr` imports from `@lit-labs/ssr-dom-shim`. Importing the global DOM shim adds more APIs to the global object, such as a global `HTMLElement`, `TreeWalker`, `fetch`, and other APIs. It is recommended that users try to remove usage of the `@lit-labs/ssr` DOM shim, and instead rely on the more minimal, automatic shimming that `@lit/reactive-element` now provides automatically.
