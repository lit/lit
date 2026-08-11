---
'@oicl-lit/gen-wrapper-vue': patch
---

Import types referenced by inherited reactive properties in generated Vue wrappers.

The generated `Props` interface includes reactive properties inherited from
superclasses and mixins, but the type imports were still derived from the
element's own properties only. Any inherited property with a named type was
emitted into `Props` without a matching import, producing a wrapper that fails
to compile.
