---
'@lit-labs/ssr-react': patch
---

Fix rendering of nested custom elements so that child custom elements will properly have the `defer-hydration` attribute from SSR, ensuring correct hydration order from parent to child.
