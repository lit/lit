---
'@lit/localize-tools': minor
---

Add `inputFiles` field, and make `tsConfig` field optional when `inputFiles` is specified. If both are set, `inputFiles` takes precedence over the input files from `tsConfig`. When `tsConfig` is not specified, a default config is used that will include `.js` files.
