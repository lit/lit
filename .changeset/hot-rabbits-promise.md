---
'lit-html': patch
'lit': patch
---

`static-html` no longer adds an item to `TemplateResult`'s value array for the last consumed static value. This fixes an error with server-side rendering of static html.
