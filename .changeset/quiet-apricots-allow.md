---
'lit-html': patch
---

Fixed bug where Template.createElement was not patchable by polyfill-support when compiled using closure compiler, leading to incorrect style scoping.
