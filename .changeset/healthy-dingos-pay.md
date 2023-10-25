---
'@lit/localize': patch
---

Loosen type for the `@localized()` decorator to be able to decorate any `ReactiveControllerHost` which also alleviates type errors that could arise with multiple copies of `@lit/reactive-element` present in the project. Also remove dependency on `@lit/reactive-element` as it is already covered by the `lit` dependency.
