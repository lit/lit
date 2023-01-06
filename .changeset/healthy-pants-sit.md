---
'@lit-labs/testing': minor
---

@lit-labs/testing no longer automatically loads the Lit SSR global DOM shim
when performing SSR, instead relying on newer versions of Lit which automatically
load necessary shims with minimal global pollution.

This may cause new or different test failures, because APIs such as `document`
will no longer be available on the server by default. Use `isServer` from the
`lit` package to guard against calling such APIs during SSR (see
https://lit.dev/docs/ssr/authoring/#browser-only-code for more information).
