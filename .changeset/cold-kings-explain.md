---
'@lit-labs/react': patch
---

Make option type for the React module we accept to be looser. This lets users provide a smaller object with just the needed API and mitigate type incompatibilities when multiple copies of React types are present.
