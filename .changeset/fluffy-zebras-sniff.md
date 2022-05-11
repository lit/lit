---
'@lit-labs/router': patch
---

Add `fallback` route option to the Routes and Router class. The fallback route
will always be matched if none of the `routes` match, and implicitly matches to
the path `/*`.
