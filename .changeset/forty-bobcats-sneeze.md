---
'lit-html': patch
---

In DEV_MODE, render a warning instead of rendering a template's host in the template.

Most commonly this would happen when rendering `${this}` in a LitElement's template, which has the counterintuitive behavior of removing the element from the DOM, because when rendering the element's template we attach it into its own shadow root, which removes it from the DOM, causing it simply disappear. This is especially problematic with a fast HMR system.
