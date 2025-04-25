---
'@lit-labs/nextjs': patch
---

Add additional options for configuring webpack rules:

- `webpackModuleRulesTest` accepts a RegExp that will match modules where Lit SSR support will be injected. Ideally it should match entrypoint to your routes. This used to be internally set as, and now defaults to, `/\/pages\/.*\.(?:j\|t)sx?$\|\/app\/.*\.(?:j\|t)sx?$/`.
- `webpackModuleRulesExclude` accepts an array of RegExp to exclude from any modules selected with above option. This used to be internally set as, and now defaults to, `[/next\/dist\//, /node_modules/]`.
