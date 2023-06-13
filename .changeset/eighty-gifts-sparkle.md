---
'@lit-labs/ssr': patch
---

Fix adding node marker for hydration for nested custom elements without attributes. This ensures nested custom elements have their `defer-hydration` attribute removed when parent is hydrated even without any attributes or bindings.
