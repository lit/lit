---
'@lit/reactive-element': major
'lit-element': major
'lit': major
---

Generated accessor for reactive properties now wrap user accessors and automatically call `this.requestUpdate()` in the setter.
