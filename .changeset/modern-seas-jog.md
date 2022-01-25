---
'@lit/localize-tools': minor
---

**BREAKING** (XLB format only) Add index to `name` attribute for `<ph>` tags for tracking placeholder locations.

XLB format users should run `lit-localize extract` to regenerate the `.xlb` file for the source locale and make sure the `<ph>` tags in other locale files have matching `name` attribute values to that of the newly generated source file.
