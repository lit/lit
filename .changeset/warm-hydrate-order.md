---
'@lit-labs/ssr-client': patch
---

Warn in dev mode when `lit-element-hydrate-support.js` is loaded after LitElement, since hydration support will not be installed in that case.
