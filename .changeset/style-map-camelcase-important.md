---
'lit-html': patch
'lit-element': patch
'lit': patch
---

`styleMap` now maps property names to CSS properties the way `CSSStyleProperties` does (CSSOM "IDL attribute to CSS property"), and always applies updates with `setProperty()`. This fixes camelCase names with `!important` values being ignored on updates (e.g. `backgroundColor: 'red !important'`) and maps `cssFloat` to `float`.

Property names are now also escaped with `CSS.escape()` in the first-render (and SSR) style text, so names that need escaping, like `'--$size'`, set the same property on first render as on updates. Pass such names unescaped; a name escaped by hand (`'--\\$size'`) is now escaped again. Server rendering needs the `CSS.escape()` shim from `@lit-labs/ssr-dom-shim`.
