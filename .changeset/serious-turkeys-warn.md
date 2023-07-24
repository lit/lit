---
'@lit/reactive-element': patch
'lit': patch
'lit-element': patch
---

Rename ReactiveElement.\_initialize to \_\_initialize, make it private, and remove the @internal annotation. This will help prevent collisions with subclasses that implement their own \_initialize method, while using development builds.
