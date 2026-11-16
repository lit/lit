---
'lit-html': patch
'lit-element': patch
'lit': patch
---

`styleMap` now maps property names to CSS properties the way `CSSStyleProperties` does (CSSOM "IDL attribute to CSS property"), and always applies updates with `setProperty()`. This fixes camelCase names with `!important` values being ignored on updates (e.g. `backgroundColor: 'red !important'`) and maps `cssFloat` to `float`. Lowercase `moz`, `ms` and `o` prefixes are no longer treated as vendor prefixes, since they are not `CSSStyleProperties` attributes; use `MozAppearance` or `'-moz-appearance'` instead of `mozAppearance`.
