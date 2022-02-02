---
'@lit/reactive-element': patch
'lit': patch
---

Update the definition of the PropertyValues type to give better types to `.get(k)`. `.get(k)` is now defined to return the correct type when using `PropertyValues<this>` and a parameter that's a key of the element class.
