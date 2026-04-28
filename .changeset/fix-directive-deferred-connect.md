---
'@lit-labs/virtualizer': patch
---

- Fixed a regression where the `virtualize` directive could fail to render any items when its host element was offset outside its parent's bounding rect (e.g., via `position: absolute` with a negative `bottom`). The directive was synchronously calling `Virtualizer.connected()` while the host was still in an unattached `DocumentFragment` produced by lit-html's template instantiation, causing clipping-ancestor detection to read empty computed styles and cache an incorrect ancestor list. The connect step is now deferred until the host is actually in the document.
