---
'@lit/reactive-element': major
'lit-element': major
'lit': major
---

Generated accessor for reactive properties now wrap user accessors and automatically call `this.requestUpdate()` in the setter. As in previous versions, users can still specify `noAccessor: true`, in which case they should call `this.requestUpdate()` themselves in the setter if they want to trigger a reactive update.
