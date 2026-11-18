---
'lit-html': patch
'lit-element': patch
'lit': patch
---

Fix `styleMap` dropping camelCase properties with `!important` values on
update. Property names are now converted to dash-case before calling
`setProperty()`, matching the first-render behavior, and `cssFloat` is
mapped to `float`.
