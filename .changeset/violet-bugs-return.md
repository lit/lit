---
'@lit/react': patch
---

When passing a `ref` callback to the Component, `createComponent` was previously intercepting it and wrapping it in an unbound function. This change memoizes the consumer `ref` with `useCallback`, to keep the reference stable and ensure it isn't invoked repeatedly on subsequent renders.
