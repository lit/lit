---
'@lit-labs/virtualizer': patch
---

- Fixed race condition where `layoutComplete` could hang indefinitely if accessed after the layout cycle had already completed.
