---
'@lit/context': patch
---

Remove dependency on `lit` package. All implementation code only uses `@lit/reactive-element`. `lit` is moved to dev dependencies as it is still used for tests.
