---
'@lit-labs/virtualizer': patch
---

Now correctly include `/support/method-interception.js` and `/support/resize-observer-errors.js` artifacts to the published package. Previously these were listed in the package exports but not actually included with the npm published package.
