---
'@lit/reactive-element': patch
'lit': patch
'lit-element': patch
---

Changed the caching behavior of the css`` template literal tag so that same-text styles do not share a CSSStyleSheet. Note that this may be a breaking change in some very unusual scenarios on Chromium browsers only.
