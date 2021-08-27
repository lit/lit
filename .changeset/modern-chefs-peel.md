---
'lit-html': patch
---

This change prevents the `styleMap` directive from returning anything other than
`noChange` from `update`. Particularly, it avoids returning the result of
calling its `render` method - a string - so that Lit will not update the
associated attribute with `setAttribute`. This allows `styleMap` to be used in
environments where security settings don't allow arbitrary text to flow into the
`style` attribute.
