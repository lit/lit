---
'@lit-labs/observers': minor
---

Fix value property of type `unknown` on exported controllers. The type of
`value` is now generic and can be inferred from the return type of your passed
in `callback`. The default callback `() => true` was removed, and is now
undefined by default.
