---
'@lit/reactive-element': minor
---

Add a new function appendStyles, for applying a CSSResult or native CSSStyleSheet into a toplevel document or shadow root without removing the
existing styles.

This is a better option for applying styles to a document than adoptStyles,
as that function assumes that the given array of styles is the complete list
of styles for the document or shadow root.
