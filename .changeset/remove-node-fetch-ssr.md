---
'@lit-labs/ssr': patch
---

Replace `node-fetch` dependency with native `fetch`. Native fetch is available in all relevant runtimes (Node ≥ 18, Deno, Bun, edge workers), making the third-party dependency unnecessary.
