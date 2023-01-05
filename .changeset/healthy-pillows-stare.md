---
'@lit-labs/ssr': patch
---

`LitElementRenderer` now uses `renderValue` from `lib/render-value.js`, removing a circular dependency.
