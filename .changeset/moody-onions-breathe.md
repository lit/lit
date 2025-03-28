---
'@lit-labs/compiler': patch
'lit-html': patch
'lit': patch
---

Remove direct imports from `trusted-types/lib` which causes an error in TS 5.8.2 with module resolution node16 or nodenext.
