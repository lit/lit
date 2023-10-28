---
'lit': patch
'lit-html': patch
---

Add a dev mode warning if a static value such as `literal` or `unsafeStatic` is detected within the non-static `html` template. These should only be used with the static `html` template imported from `lit-html/static.js` or `lit/static-html.js`.
