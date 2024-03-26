---
'@lit/task': patch
---

Make `status` of Task a readonly property

So far `status` was writable which allowed for setting status of task form outside. Doing so did cause rendering of
expected template but the task was becoming internally incoherent.

Now attempt to assign `status` will end up in throwing a `TypeError`.
