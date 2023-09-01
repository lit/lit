---
'@lit-labs/context': patch
---

Fix an infinite loop that could result when declares multiple providers for a single context. This is an error, but we shouldn't go into an infinite loop over it.
