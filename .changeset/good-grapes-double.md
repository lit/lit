---
'lit-html': patch
'lit': patch
---

Improved the type inferece of the `choose()` directive to properly restrict the case type inferred from provided value. **Note**: If this change creates a type error in your code, there must have been an unreachable case that can be removed, or the type of your `value` might be missing a valid case in the union.
