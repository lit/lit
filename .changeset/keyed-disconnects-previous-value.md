---
'lit-html': patch
'lit-element': patch
'lit': patch
---

Fix the `keyed()` directive leaking the value it replaces. When the key changed, the previous value was never disconnected, so `ref()` callbacks and other async directives inside it were never notified, and the part kept every previous value and its DOM alive.
