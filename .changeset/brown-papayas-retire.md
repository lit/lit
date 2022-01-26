---
'@lit-labs/ssr': patch
---

Fix TypeScript typing issues when using @lit-labs/ssr. Adds a dependency on @types/node for URL, which is part of the public ModuleLoader API. Adds a new VmModule interface for the ModuleLoader API, whose return type was previously completely missing.
