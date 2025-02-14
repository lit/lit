---
'@lit-labs/ssr': patch
---

Use `WeakMap` for template cache. This prevents memory leaks when templates are dynamically created e.g. in combination with `unsafeHTML()`.
