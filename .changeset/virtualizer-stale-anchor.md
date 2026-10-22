---
'@lit-labs/virtualizer': patch
---

Flow layout: re-pick the anchor when the scroll position moves out of its range while a previous reflow is still settling. Before, scrolling back to the top shortly after jumping to the end was undone by a scroll correction toward the stale anchor.
