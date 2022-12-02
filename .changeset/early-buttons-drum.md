---
'@lit-labs/virtualizer': minor
---

Adds an element(index) proxy with scrollIntoView() method mirroring native Element.scrollIntoView()

- Adds layoutComplete getter on virtualizer that returns a promise exposing the completion of the cycle of rendering and measuring of items.
- This also includes a fair bit of internal refactoring addressing scrolling-related code and layouts.
