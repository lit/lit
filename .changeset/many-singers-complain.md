---
'@lit/localize-tools': minor
---

**BREAKING** Update analysis to consider messages with same id **and** description to be identical (but no longer checks for expressions to be same) and improve error message on finding incompatible duplicates.

`lit-locazlie extract` will now error if multiple messages had the same text but different `desc` option. Be sure to add the same `desc` option for these messages to be considered the same translatable to message or add different `id` options to differentiate them.
