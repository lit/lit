---
'lit': patch
'lit-element': patch
'lit-html': patch
'@lit/reactive-element': patch
---

Changed prefix used for minifying class field names on lit libraries to stay within ASCII subset, to avoid needing to explicitly set the charset for scripts in some browsers.
