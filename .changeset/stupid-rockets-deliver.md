---
'@lit/reactive-element': patch
---

Fix `@queryAssignedElements` decorator so it is compatible with legacy browsers.
Uses `HTMLSlotElement.assignedElements` if available with a graceful fallback
on `HTMLSlotElement.assignedNodes` which is supported by polyfills.
