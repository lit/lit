---
'@lit/localize-tools': patch
---

Translated message validation that runs before the `build` step now disregards template literal expressions. This allow source code to have variables in expressions renamed while still keeping the same translations, or avoid errors that could happen from module import order changing which expression gets picked up first when multiple `msg()` calls with the same id have different expressions. This behavior is more consistent with how a translation unit is identified according to [how the message id is generated](https://lit.dev/docs/localization/overview/#id-generation).
