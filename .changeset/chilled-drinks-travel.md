---
'@lit-labs/ssr-client': minor
'lit-html': minor
'lit': minor
---

Fix return type of `isTemplateResult` helper to include the `CompiledTemplateResult` and fix the `cache` directive to work correctly with `CompiledTemplateResult`s. Add an explicit error message for ssr hydration to throw on `CompiledTemplate`s. Any usage of `isTemplateResult` without a second argument should also be handling the compiled template.
