---
'@lit-labs/virtualizer': minor
---

Added support for a `data-min-width` attribute on the host element of non-scroller virtualizers, overriding the automatically computed `min-width` so children wider than the viewport (e.g. zoomed content) can force a real horizontal scrollbar on the scrolling ancestor instead of being clamped to 100% width.
