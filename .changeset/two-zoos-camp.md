---
'lit-html': patch
---

In development mode, constructing an `EventPart` from an improperly formed attribute will now throw: the attribute must contain only a single expression and the surrounding two strings must be the empty string. Before, constructing an `EventPart` with extra expressions or surrounding text would cause that part to be silently and incorrectly treated as an `AttributePart`.
