---
'@lit-labs/virtualizer': patch
---

- Fixed a regression where no content renders when the virtualizer is inside a shadow DOM host whose `<slot>` has `overflow: hidden`. Elements with `display: contents` (like `<slot>`) generate no CSS box, so their `overflow` value is meaningless; they are now excluded from the list of clipping ancestors to avoid collapsing the viewport to zero.
