---
'@lit-labs/virtualizer': major
---

BREAKING: Replace top-level access to `window` with `globalThis` so that loading the module won't error in non-browser environments.

A polyfill for `globalThis` may be needed if you are targeting an environment that does not support it.
