---
'lit': minor
'lit-html': minor
'@lit/reactive-element': minor
---

Lit and its underlying libraries can now be imported directly from Node without crashing, without the need to load the @lit-labs/ssr dom-shim library. Note that actually rendering from a Node context still requires the @lit-labs/ssr dom-shim, and the appropriate integration between @lit-labs/ssr and your framework/tool.
