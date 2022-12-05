---
'@lit-labs/ssr': major
---

The Lit SSR DOM shim no longer defines a global `window` variable. This was removed to improve compatibility with libraries that detect whether they are running in Node vs the browser by checking for the presence of `window`.

If you have code that runs during SSR which depends on the presence of `window`, you can either replace `window` with `globalThis`, or use `isSsr` to avoid running that code on the server (see https://lit.dev/docs/ssr/authoring/#browser-only-code).
