---
'@lit-labs/virtualizer': minor
---

Adds an element(index) proxy with scrollIntoView() method mirroring native Element.scrollIntoView()

- Adds layoutComplete getter on virtualizer that returns a promise exposing the completion of the cycle of rendering and measuring of items.
- Adds virtualizerRef symbol to make obtaining access to virtualizer from the host element when using the virtualize() directive.
- This also includes a fair bit of internal refactoring addressing scrolling-related code and layouts.
