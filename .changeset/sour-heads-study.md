---
'lit-html': patch
---

Add type SVGElement to render root union type. Change resolves type error when passing an SVGElement as the container argument to render(...), allowing SVG elements to be used as valid render roots.
