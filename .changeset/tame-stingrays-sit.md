---
'@lit-labs/eleventy-plugin-lit': patch
---

Fix transform breakage in situations where `outputPath` is false (e.g. setting `permalink: false` or using the serverless plugin).
