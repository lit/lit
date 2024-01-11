# @lit-labs/eleventy-plugin-lit

## 1.0.3

### Patch Changes

- [#4311](https://github.com/lit/lit/pull/4311) [`cabe72a8`](https://github.com/lit/lit/commit/cabe72a863a5de14a4bbca384374db748dd9b4c5) - Update version range for `lit` dependency to include v2. This allows projects still on lit v2 to use this package without being forced to install lit v3.

- [#4314](https://github.com/lit/lit/pull/4314) [`f9c3659f`](https://github.com/lit/lit/commit/f9c3659f28ba2fc0bc6325ba569c2107ee0afb19) - Fix ModuleLoader so it can load modules concurrently.

## 1.0.2

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies:
  - lit@3.0.0

## 1.0.2-pre.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`77e9b48e`](https://github.com/lit/lit/commit/77e9b48e4aefc61d5fe31939019c281d7303137c), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit-labs/ssr@3.1.8-pre.0
  - lit@3.0.0-pre.1

## 1.0.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - lit@3.0.0-pre.0
  - @lit-labs/ssr@3.1.3-pre.0

## 1.0.1

### Patch Changes

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - Use hydration modules from `@lit-labs/ssr-client`

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
