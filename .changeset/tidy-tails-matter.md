---
'@lit-labs/router': patch
---

Fix `getTailGroup` selecting the wrong nested-route tail when a named param contains a digit (e.g. `:id1`) or when a pattern produces 10 or more numeric groups
