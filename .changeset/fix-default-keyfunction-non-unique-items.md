---
'@lit-labs/virtualizer': patch
---

- Fixed the default `keyFunction` so that virtualizers with non-unique scalar items (e.g., repeated string values) render correctly and don't crash during scrolling. The default was `(item) => item`, which produced duplicate keys for lit-html's `repeat` directive and caused malformed DOM, off-by-one child counts, and eventually a `TypeError: Cannot read properties of null (reading 'nextSibling')` thrown from `ChildPart._$clear`. The new default is `(_item, index) => index`, matching lit-html's own `repeat` behavior when no key function is supplied. (#5296)
