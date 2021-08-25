---
'lit-html': patch
---

Improves disconnection handling for first-party `AsyncDirective`s (`until`, `asyncAppend`, `asyncReplace`) so that the directive (and any DOM associated with it) can be garbage collected before any promises they are awaiting resolve.
