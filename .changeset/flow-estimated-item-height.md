---
'@lit-labs/virtualizer': minor
---

Added an `estimatedItemHeight` option to the `flow` layout specifier, for a better initial item height estimate than the default 100px. Using an accurate estimate avoids over-rendering and scroll-extent jumpiness when children are much taller than the default, such as auto-sized or lazily loading content.