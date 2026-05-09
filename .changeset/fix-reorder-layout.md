---
'@lit-labs/virtualizer': patch
---

- Fixed incorrect layout (overlaps/gaps) after reordering items when using a `keyFunction`. Lit's `repeat` directive reorders DOM elements without resizing them, so the `ResizeObserver` never fired to trigger re-measurement. The `MutationObserver` now detects child reorders and re-measures accordingly.
