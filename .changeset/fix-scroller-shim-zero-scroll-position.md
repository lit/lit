---
'@lit-labs/virtualizer': patch
---

- Fixed `ScrollerShim.scrollTop` and `ScrollerShim.scrollLeft` returning the wrong value when the wrapped element was at scroll position 0. The getters used logical OR to fall back to `window.scrollY` / `window.scrollX`, which treated a legitimate zero as falsy and substituted the window's scroll position. For an inner scroll container at the top, this returned the outer page's scroll position rather than the inner element's actual zero. Switched to nullish coalescing so legitimate zero values are preserved. As a bonus, this also avoids accessing `window.scrollX` / `window.scrollY` in normal operation, which is helpful in environments where those APIs aren't available.
