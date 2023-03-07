---
'@lit-labs/analyzer': minor
---

Moved analysis of class fields that only have constructor initializers from ReactiveProperty to ClassField analysis, and removed type field from ReactiveProperty model, since this is already covered by ClassField.
