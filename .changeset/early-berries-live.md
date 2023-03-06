---
'@lit-labs/analyzer': minor
---

Adds support for overloaded functions. Methods of model objects that accept a
string key will now specifically return the `FunctionDeclaration` of the
implementation signature of an overloaded function, which has a new `overloads`
field containing a `FunctionOverloadDeclaration` for each overload signature.
