---
'@lit/reactive-element': patch
'lit-element': patch
'lit': patch
---

Fix a bug where accessing a `@query` decorated field with the `cache` flag set before the first update would result in `null` being cached permanently. `null` will no longer be cached before the first update and in `DEV_MODE` now raises a warning.
