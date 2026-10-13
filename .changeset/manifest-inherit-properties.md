---
'@lit-labs/gen-manifest': minor
---

Add an `inheritProperties` option to the manifest generator. When enabled, members (fields, methods, etc.) and reactive properties inherited from a custom element superclass or mixin in the same package are included on each element in the manifest, marked with an `inheritedFrom` reference. Subclass members take precedence over inherited members of the same name. The CLI `lit gen` command exposes this as the `--inherit-properties` flag, which requires `--manifest`.
