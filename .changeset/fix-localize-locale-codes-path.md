---
'@lit/localize-tools': patch
---

Resolve `localeCodesModule` relative to the localization config file in runtime and transform builds. If your config lives in a subdirectory and you prefixed `localeCodesModule` with that directory to work around the old working-directory behavior, remove the prefix.
