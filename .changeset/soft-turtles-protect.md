---
'@lit-labs/ssr': minor
'lit-html': minor
'lit': minor
---

Improved how nodes with attribute/property/event/element bindings are rendered in SSR, to avoid adding comments inside of "raw text elements" like `<textarea>`. Fixes #3663.

Note: `@lit-labs/ssr` and `lit-html` must be updated together.
