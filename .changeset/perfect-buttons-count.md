---
'lit-html': patch
---

Don't allow classMap to remove static classes. This keeps classMap consistent with building a string out of the classnames to be applied.
