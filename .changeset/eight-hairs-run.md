---
'lit': minor
'lit-html': minor
---

Adds an `isServer` variable export to `lit` and `lit-html/is-server.js` which will be `true` in Node and `false` in the browser. This can be used when authoring components to change behavior based on whether or not the component is executing in an SSR context.
