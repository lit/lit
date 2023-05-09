---
'lit-html': patch
---

Fix a memory leak cause by lit-html's shared TreeWalker holding a reference to the last tree it walked.
