---
'@lit-labs/ssr-client': patch
---

Fix `litElementHydrateSupport` breaking async directive connection state: set `renderOptions.isConnected` from the element before the first update so directives like `ref()` do not fire while the element is detached, and propagate `connectedCallback`/`disconnectedCallback` to the hydrated root part via `setConnected()` so async directives receive disconnect/reconnect callbacks when the element moves.
