---
'@lit/localize': patch
---

Loosen type for the `@localized()` decorator to accept cross version `ReactiveElement`s. Also remove dependency on `@lit/reactive-element` as it is already covered by the `lit` dependency.
