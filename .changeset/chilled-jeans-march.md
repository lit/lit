---
'@lit-labs/task': major
---

Adds the `'afterUpdate'` option for `autoRun` to Task, and runs tasks by default in `hostUpdate()` instead of `hostUpdated()`. `'afterUpdate'` is needed to run tasks dependent on DOM updates, but will cause multiple renders of the host element.
