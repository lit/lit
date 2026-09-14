---
'@lit/reactive-element': patch
---

Fix `useDefault: true` for properties initialized to `null` or `undefined`. Nullish
default values are now recorded and restored when an attribute is removed, so a
`null` default is no longer confused with "no default", and an `undefined` default is
no longer replaced by `null`. This also fixes a `TypeError` thrown when a standard
decorator `accessor` with `useDefault: true` was initialized to `null`.
