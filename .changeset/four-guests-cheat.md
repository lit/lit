---
'@lit-labs/eleventy-plugin-lit': minor
---

Add option to use worker threads instead of vm modules for isolated rendering and set this as the default mode which removes the need to use the `--experimental-vm-modules` flag. The vm mode is still available via config option and will require the flag.

Potentially breaking due to the way Node's worker threads reads .js files as modules. See [here](https://github.com/lit/lit/tree/main/packages/labs/eleventy-plugin-lit#configure-component-modules) for information on configuring components in worker mode.
