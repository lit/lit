---
'@lit-labs/ssr': patch
---

Don't assign DOM shim window.global (and hence globalThis.global) to window

This means that globalThis.global will retain its Node built-ins, whereas
before it would lose anything we didn't explicitly set on window.

Fixes https://github.com/lit/lit/issues/2118
