---
'@lit-labs/router': minor
---

Add `prefix` option to `Router` for SPAs served on subpaths. When set, the router only intercepts navigation for URLs under the given prefix, allowing links outside it (e.g. to other apps on the same host) to perform full-page navigation. The `link()` method also prepends the prefix so child routes generate correct full paths.
