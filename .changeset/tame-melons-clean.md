---
'@lit-labs/virtualizer': patch
---

Fix a memory leak: children were never unobserved from `_childrenRO` after leaving the rendered range, so every item a virtualizer ever rendered stayed alive for its whole lifetime.
