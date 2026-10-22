---
"@lit-labs/observers": patch
---

Fix missing `lit-html` runtime dependency in `@lit-labs/observers`. Controllers import `isServer` from `lit-html/is-server.js` but `lit-html` was only listed in devDependencies, causing module resolution errors for consumers under strict package managers such as pnpm.
