---
'@lit-labs/virtualizer': minor
---

- Virtualizer now automatically detects scroll direction from CSS `writing-mode`, replacing the explicit `direction` layout config option (which is now deprecated but still supported).
- Added `axis` property (`'block'` | `'inline'`) for inline-axis scrolling (e.g., horizontal carousels).
- Full support for `vertical-lr` and `vertical-rl` writing modes, including window scrolling.
- Added a deprecation warning for the `direction` layout config.
- Removed the `min-block-size: 150px` scroller default; a console warning now fires if a scroller-mode virtualizer has zero size.
- Clarified masonry layout's `getAspectRatio` as visual `width / height` and preserved that semantic across all writing-mode and axis configurations. Migrating from `direction: 'horizontal'` to `axis: 'inline'` continues to work without changing the aspect-ratio callback. A follow-up API for logical (inlineSize / blockSize) aspect ratios is tracked at #5308.
