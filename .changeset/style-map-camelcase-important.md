---
'lit-html': patch
'lit-element': patch
'lit': patch
---

Fix `styleMap` ignoring camelCase property names with `!important` values on updates (e.g. `backgroundColor: 'red !important'`), and map `cssFloat` to the `float` CSS property.
