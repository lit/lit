---
"lit-html": patch
---

Make `asyncAppend` and `asyncReplace` directive functions generic so that TypeScript correctly infers the mapped value type when a mapper function is provided.
