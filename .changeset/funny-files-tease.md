---
'@lit/reactive-element': patch
'@lit-labs/ssr-client': patch
'@lit-labs/react': patch
'lit-html': patch
'@lit/react': patch
'lit-element': patch
'lit': patch
---

Add "browser" export condition entrypoints to any package.json files with "node"
export conditions. This fixes test runners that were incorrectly loading the
"node" entrypoints instead of the browser code.
