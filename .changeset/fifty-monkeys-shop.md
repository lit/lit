---
'@lit/reactive-element': patch
'lit': patch
---

Fix `CSSStyleSheet is not defined` error that would occur when importing a Lit component in Node when both static `styles` and the `@property` decorator were used.
