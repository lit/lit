---
'@lit/reactive-element': patch
---

Adds `scheduleUpdate()` to control update timing. This should be implemented instead of `performUpdate()`; however, existing overrides of `performUpdate()` will continue to work.
