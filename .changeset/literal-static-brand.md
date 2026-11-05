---
'lit-html': patch
---

Check the `StaticValue` brand in `literal` so that JSON-parsed objects with a `_$litStatic$` key are rejected, matching `html`/`svg` from `lit-html/static.js`.
