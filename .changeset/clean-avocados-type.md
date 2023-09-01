---
'@lit-labs/context': patch
---

Fix an infinite loop that occurred when multiple providers were declared for a single context on the same host. This is an error, but we shouldn't go into an infinite loop over it.
