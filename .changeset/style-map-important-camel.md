---
'lit-html': patch
'lit-element': patch
'lit': patch
---

`styleMap` now dash-cases camelCase property names when applying `!important` values during an update, matching the first render.
