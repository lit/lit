---
'@lit-labs/ssr-client': patch
---

Fix `lit-element-hydrate-support` so async directives in a `LitElement` track the host's connection state: they are disconnected and reconnected when the element moves, and are not connected on the first update if the element was already removed.
