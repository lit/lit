---
'lit-html': patch
'lit': patch
---

Fix a DOM leak in `removePart()` (from `lit-html/directive-helpers.js`) where the part's end marker comment was left behind. Each call leaked a `<!---->` node; under sustained churn (e.g. `@lit-labs/virtualizer` scrolling, which removes items at one edge and adds at the other) this caused unbounded DOM accumulation and a steady per-operation cost climb. Introduced in #4975 (released in `lit-html@3.3.1`).
