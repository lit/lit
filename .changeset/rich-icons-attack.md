---
'@lit-labs/ssr': minor
---

APIs such as attachShadow, setAttribute have been moved from the HTMLElement class shim to the Element class shim, matching the structure of the real API. This should have no effect in most cases, as HTMLElement inherits from Element.
