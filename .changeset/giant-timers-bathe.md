---
'@lit-labs/router': patch
---

Update URLPattern polyfill dependency, and fix types. The params passed into
`render` and `enter` may contain `undefined` values as [Unmatched optional
groups are set to undefined instead of
''](https://github.com/kenchris/urlpattern-polyfill/issues/66).
