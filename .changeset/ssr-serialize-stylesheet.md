---
'@lit-labs/ssr': patch
---

Serialize `CSSStyleSheet` styles that were not converted to `CSSResult` during SSR, so elements with stylesheet-based `static styles` no longer render an empty `<style>` in server-rendered declarative shadow DOM.
