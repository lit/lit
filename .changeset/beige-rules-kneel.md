---
'lit-html': patch
'@lit/reactive-element': patch
---

Fixes polyfill-support styling issues: styling should be fully applied by firstUpdated/update time; late added styles are now retained (matching Lit1 behavior)
