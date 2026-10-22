---
'lit-html': patch
'lit-element': patch
'lit': patch
---

Fix Node document mock detection to check for createTreeWalker so incomplete document mocks (e.g. Stencil Jest) still get the TreeWalker stub.
