---
'@lit-labs/ssr-dom-shim': minor
'@lit-labs/ssr': patch
---

Add a `CSS` namespace shim with `CSS.escape()`, installed on `globalThis` when missing and added to the `@lit-labs/ssr` window shim. `styleMap` uses it to escape property names when rendering on the server.
