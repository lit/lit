---
'@lit-labs/ssr': patch
---

Adds a shim for `document.querySelector`. This was made to Addresses #2391 and resolves the issue when trying to render lit components with SSR in `Next.js` where the `@lit-labs/ssr/lib/install-global-dom-shim.js` is necessary to be imported, but the compilation results in the following error in `styled-jsx` package: `TypeError .. document.querySelector is not a function` [Code sandbox repo which reproduces the issue](https://codesandbox.io/s/nextjs-lit-forked-cymhs?file=/components/Button.client.tsx).
