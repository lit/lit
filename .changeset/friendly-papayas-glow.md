---
'lit': patch
'lit-html': patch
---

Disable ShadyDOM noPatch in Node dev build. This fixes the issue of throwing due to undefined `window`.
