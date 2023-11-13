---
'@lit/reactive-element': patch
'lit': patch
'lit-element': patch
---

Fixes bug where adding or removing controllers during a reactive controller lifecycle would affect the execution of other controllers (#4266). Controllers can now be added/removed during lifecycle without affecting others.
