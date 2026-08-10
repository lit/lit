---
'@oicl-lit/gen-wrapper-angular': patch
'@oicl-lit/gen-wrapper-svelte': patch
'@oicl-lit/gen-wrapper-react': patch
'@oicl-lit/gen-utils': patch
'@oicl-lit/cli': patch
---

Point `repository.url` at the Ocean-Industries-Concept-Lab fork

npm's trusted publishing verifies the provenance bundle against
`repository.url`, so publishing failed with E422 while it still pointed at
`lit/lit`.
