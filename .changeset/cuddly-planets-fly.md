---
'lit': patch
'lit-element': patch
'lit-html': patch
'@lit-labs/observers': patch
---

Revert the Terser plugin for Rollup to `rollup-plugin-terser` from `@rollup/plugin-terser`
due to a bug that prevented our minified name prefixing from working.
