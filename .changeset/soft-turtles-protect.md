---
'@lit-labs/ssr': patch
'lit-html': patch
---

Improved how nodes with attribute/property/event/element bindings are rendered in SSR, to avoid adding comments inside of "raw text elements" like `<textarea>`. Fixes #3663.
