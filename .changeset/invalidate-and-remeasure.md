---
'@lit-labs/virtualizer': minor
---

Added `invalidateAndRemeasure()` to `Virtualizer` and the `<lit-virtualizer>` element. It clears the layout's cached child size metrics and requests a full re-flow, for when children may have changed size outside of the virtualizer's own measurements, e.g. when their size depends on a container dimension that changed since they were measured, or on lazily loaded content.
