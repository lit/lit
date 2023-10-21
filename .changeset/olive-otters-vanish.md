---
'@lit-labs/ssr-client': patch
---

Avoid nullish logical assignment in hydrate-lit-html which some minification process would not handle correctly. Fixes hydration errors in Next.js production bundles.
