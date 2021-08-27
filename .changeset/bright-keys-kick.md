---
'lit-html': patch
---

Fix ChildPart parentNode for top-level parts to return the parentNode they _will_ be inserted into, rather than the DocumentFragment they were cloned into. Fixes #2032.
