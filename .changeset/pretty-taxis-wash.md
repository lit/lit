---
'@lit-labs/nextjs': patch
---

Add plugin option `includeDSDPolyfill` which, if true, will add a script to the client bundle which will apply the `@webcomponents/template-shadowroot` ponyfill on the document.
