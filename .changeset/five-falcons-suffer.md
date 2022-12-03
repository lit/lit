---
'@lit-labs/analyzer': minor
'@lit-labs/cli': minor
---

Added superclass analysis to ClassDeclaration, along with the ability to query exports of a Module (via `getExport()` and `getResolvedExport()`) and the ability to dereference `Reference`s to the `Declaration` they point to (via `dereference()`). A ClassDeclaration's superClass may be interrogated via `classDeclaration.heritage.superClass.dereference()` (`heritage.superClass` returns a `Reference`, which can be dereferenced to access its superclass's `ClassDeclaration` model.
