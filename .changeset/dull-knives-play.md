---
---

Adds a new 'all' bundle flavor, which re-exports all features from `lit-html`,
`@lit/reactive-element`, and `lit-element`. The normal and 'all' bundles are
generated during the build in both ESM and UMD formats. The new bundles are not
yet included in any release format (e.g. the npm package) and are only available
when building locally (like the existing bundle).
