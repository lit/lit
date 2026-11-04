---
'lit-html': patch
'lit-element': patch
'lit': patch
---

Make the `asyncAppend` directive generic so the mapper function's value parameter is inferred from the async iterable's element type instead of `unknown`.
