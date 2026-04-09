---
'@lit-labs/virtualizer': patch
---

- Fixed `scrollToIndex` scrolling to the item's margin edge instead of its border edge (#5286). With non-uniform margins, the scroll position was offset by the target item's `margin-block-start` value.
