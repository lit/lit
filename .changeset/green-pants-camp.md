---
'@lit-labs/react': patch
---

Provide the explicit return type `WrappedWebComponent` for `createComponent`. This exposes an explicit typing for wrapped components rather than relying on inferences from Typescript. A well defined type should provide more resilience for implementations like SSR and others.
