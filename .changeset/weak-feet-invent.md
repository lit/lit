---
'lit': patch
'lit-html': patch
'@lit/reactive-element': patch
---

Make the event debug logger lazier, doing even less work (with no side effects) even in dev mode unless the page has opted in.
