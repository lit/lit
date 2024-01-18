---
'@lit/localize-tools': patch
---

Fix an issue where running `extract` on an existing translation target would rewrite the "id" for placeholders signifying the expression index, which breaks translation targets where the expressions need to be reordered.
