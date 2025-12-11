---
'@lit-labs/analyzer': minor
---

Declared union types are now preserved instead of being widened to their base type. This fixes unexpected type errors in the property accessors created by the Angular wrapper generator.
