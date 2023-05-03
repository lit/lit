---
'@lit-labs/analyzer': minor
'@lit-labs/cli': minor
---

The analyzer no longer crashes when a class extending `LitElement` has a
property with a non-identifier name and instead adds a diagnostic. The CEM
generator now logs diagnostics collected while generating the manifest.
