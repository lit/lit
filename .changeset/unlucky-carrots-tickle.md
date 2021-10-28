---
'@lit/reactive-element': patch
---

Prevents the dev-mode error about shadowed properties from being thrown in
certain cases where the property intentionally has no generated descriptor.
