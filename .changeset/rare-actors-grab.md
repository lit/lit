---
'@lit-labs/virtualizer': patch
---

Guard top-level `window` with `typeof` check so that importing the code will not throw when imported in non-browser environments without a global `window` defined. Note, this on its own will not server render items inside the virtualizer, but it will no longer error when attempting to do so.
