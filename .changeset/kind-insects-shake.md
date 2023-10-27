---
'lit-html': patch
'lit': patch
---

The `when()` directive now calls the case functions with the provided condition value as an argument. This allows the narrowing of types for the condition value based on its truthiness when used as a parameter for the case function.
