---
'@lit-labs/ssr': patch
---

Fix behavior of setAttribute when value is not a string to match browsers. It is now cast to a string. Fixes problems such as reflection of type:Number properties on ReactiveElements.
