---
'@lit-labs/virtualizer': major
---

- Significantly overhaul scrolling implementation
  - Make smooth scrolling work as seamlessly as possible
  - Make the API for scrolling to a virtualizer child element more like the corresponding native API
  - Add a `pin` option to layouts: declaratively specify scroll position relative to a given child element
- Make `<lit-virtualizer>` use the `virtualize()` directive under the hood, restoring original factoring and reducing duplication
- Standardize on one way to specify layout (factory function + config object), removing support for older (mostly never documented) options
- Fix [[labs/virtualizer] keyFunction based on index doesn't work properly #3491](https://github.com/lit/lit/issues/3491)
- Fix [[labs/virtualizer] Grid layout scrollSize calculated incorrectly when padding doesn't match gap #3492](https://github.com/lit/lit/issues/3492)
