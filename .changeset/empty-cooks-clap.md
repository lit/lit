---
'@lit-labs/eleventy-plugin-lit': minor
---

The Lit SSR global DOM shim is no longer automatically loaded when rendering Lit components from Eleventy. When paired with the latest version of Lit, the global DOM shim is no longer typically required, because Lit now automatically imports shimmed versions of needed APIs.
