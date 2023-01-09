# @lit-labs/eleventy-plugin-lit

## 1.0.0

### Major Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - The Lit SSR global DOM shim is no longer automatically loaded when rendering Lit components from Eleventy. When paired with the latest version of Lit, the global DOM shim is no longer typically required, because Lit now automatically imports shimmed versions of needed APIs.

### Patch Changes

- Updated dependencies [[`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`ff637f52`](https://github.com/lit/lit/commit/ff637f52a3c2252e37d6ea6ae352c3c0f35a9e87), [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`c77220e8`](https://github.com/lit/lit/commit/c77220e80bc5b04628776ef8e5828fcde5f8ad16)]:
  - @lit-labs/ssr@3.0.0
  - lit@2.6.0

## 0.2.3

### Patch Changes

- [#3203](https://github.com/lit/lit/pull/3203) [`23462312`](https://github.com/lit/lit/commit/234623129990c19c535eb36d2bcab38f3842ff82) - Use file urls for resolved module paths for Windows compatibility

- Updated dependencies [[`daddeb34`](https://github.com/lit/lit/commit/daddeb346a2f454b25a6a5d1722683197f25fbcd), [`6361a4b4`](https://github.com/lit/lit/commit/6361a4b4a589465cf6836c8454ed8ca4521d7b4d), [`ae6f6808`](https://github.com/lit/lit/commit/ae6f6808f539254b72ec7efcff34b812173abe64)]:
  - lit@2.3.0

## 0.2.2

### Patch Changes

- [#3006](https://github.com/lit/lit/pull/3006) [`da4e097b`](https://github.com/lit/lit/commit/da4e097b09ba5769a3daa4f1539c415ce3699a5e) - Fix transform breakage in situations where `outputPath` is false (e.g. setting `permalink: false` or using the serverless plugin).

## 0.2.1

### Patch Changes

- [#2797](https://github.com/lit/lit/pull/2797) [`5ae56da2`](https://github.com/lit/lit/commit/5ae56da2c76e9852af26fe387c7c0e689afc76fa) - Fix worker mode by ensuring worker file is run as ES module.

## 0.2.0

### Minor Changes

- [#2591](https://github.com/lit/lit/pull/2591) [`a01ffdf6`](https://github.com/lit/lit/commit/a01ffdf6e58ea1c5269579215a442a53b04040f6) - Add option to use worker threads instead of vm modules for isolated rendering and set this as the default mode which removes the need to use the `--experimental-vm-modules` flag. The vm mode is still available via config option and will require the flag.

  Potentially breaking due to the way Node's worker threads reads .js files as modules. See [here](https://github.com/lit/lit/tree/main/packages/labs/eleventy-plugin-lit#configure-component-modules) for information on configuring components in worker mode.

### Patch Changes

- [#2637](https://github.com/lit/lit/pull/2637) [`3cff5a21`](https://github.com/lit/lit/commit/3cff5a2174abdd453b973ba42f0abe8fa343840f) - Update README to clarify using .cjs extension for eleventy config

## 0.1.1

### Patch Changes

- [#2551](https://github.com/lit/lit/pull/2551) [`3e3aa21d`](https://github.com/lit/lit/commit/3e3aa21db9cdd1cad3ed8c95511684b2d7241892) - Fix issue related to "request for <module> is not yet fulfilled" errors when loading multiple component modules.

## 0.1.0

### Minor Changes

- [#2499](https://github.com/lit/lit/pull/2499) [`3efb256d`](https://github.com/lit/lit/commit/3efb256dc1988f14c65d2bdfd060bdcfcd09f97a) - Initial release of @lit-labs/eleventy-plugin-lit
