---
'lit-html': patch
---

Make some of our directives generic, so that their DirectiveResult types capture everything needed to infer their render types. This is useful in template type checking.
