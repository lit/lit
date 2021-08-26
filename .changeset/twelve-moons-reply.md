---
'@lit/reactive-element': patch
---

Fixes #2062. To match Lit1 behavior, the @query decorator returns null (rather than undefined) if a decorated property is accessed before first update. Likewise, a @queryAll or @queryAssignedNodes decorated property returns [] rather than undefined.
