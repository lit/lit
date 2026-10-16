---
'@lit/react': patch
---

Remove the event listeners added for mapped event props when the wrapper component unmounts, so callbacks no longer run on a custom element that is kept and reconnected after its React owner is gone.
