---
'@lit-labs/ssr-react': minor
---

The Node build of `@lit-labs/ssr-react/enable-lit-ssr.js` will now also monkey-patch `react/runtime-jsx` to include logic for deeply server-side rendering Lit components without modifying `jsxImportSource` in tsconfig.

The monkey-patching logic also adds a workaround for inconsistent es module interop behavior in tools like webpack which could lead to errors like `TypeError: Cannot set property createElement of [object Module] which has only a getter`.
