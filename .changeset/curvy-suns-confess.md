---
'lit-html': patch
---

Binding `noChange` into an interpolated attribute expression now no longer removes the attribute on first render - instead it acts like an empty string. This is mostly noticable when using `until()` without a fallback in interpolated attributes.
