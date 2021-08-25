---
'lit-element': patch
'lit-html': patch
'@lit/reactive-element': patch
---

Update some internal types to avoid casting `globalThis` to `any` to retrieve globals where possible.
