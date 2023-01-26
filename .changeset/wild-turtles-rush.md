---
'@lit-labs/virtualizer': minor
---

RangeChangedEvent and VisibilityChangedEvent both no longer bubble up. Listeners for these events must be placed on the lit-virtualizer or virtualize directive's host element.
