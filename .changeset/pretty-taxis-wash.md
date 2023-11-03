---
'@lit-labs/nextjs': patch
---

Add plugin option `addDeclarativeShadowDomPolyfill` which, if true, will add a script to the client bundle which will apply the `@webcomponents/template-shadowroot` ponyfill on the document. Note: If you were manually adding the polyfill, you can either remove your own implementation or set this option to `false`.
