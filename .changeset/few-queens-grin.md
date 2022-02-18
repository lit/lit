---
'@lit-labs/ssr': patch
---

Resolves the issue happening in `Nuxt2` after building and running the app: `Cannot find module 'parse5’, Require stack: /node_modules/@lit-labs/ssr/lib/util/parse5-utils.js`.

Issue was reproduced in this repo, you can see it by running `npm run serve` and then by browsing the page: https://github.com/mohsenasfia/nuxt2
