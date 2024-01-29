---
'@lit-labs/ssr': patch
---

Fix a bug where server templates with attribute bindings on certain element tags like `<td>` used top-level would throw an error during server render.
