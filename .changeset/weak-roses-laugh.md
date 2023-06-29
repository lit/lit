---
'lit-html': patch
'lit': patch
---

Change the `h` field of `CompiledTemplate`s to a `TemplateStringsArray` preventing the spoofing of `CompiledTemplate`s by JSON injection attacks. This should not be a breaking change for most users unless you're using CompiledTemplates. This is a necessary security fix, similar to [#2307](https://github.com/lit/lit/pull/2307).
