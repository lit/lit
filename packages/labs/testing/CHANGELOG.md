# @lit-labs/testing

## 0.2.3

### Patch Changes

- [#4306](https://github.com/lit/lit/pull/4306) [`c28ebba1`](https://github.com/lit/lit/commit/c28ebba15669042144db48563611b2c9bb7a2e47) - Update version range for `lit` dependency to include v2. This allows projects still on lit v2 to use this package without being forced to install lit v3.

- [#4306](https://github.com/lit/lit/pull/4306) [`c28ebba1`](https://github.com/lit/lit/commit/c28ebba15669042144db48563611b2c9bb7a2e47) - Update dependency version to refer to stable versions, rather than pre-release versions of our own packages.

## 0.2.2

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies:
  - lit@3.0.0

## 0.2.2-pre.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`77e9b48e`](https://github.com/lit/lit/commit/77e9b48e4aefc61d5fe31939019c281d7303137c), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit-labs/ssr@3.1.8-pre.0
  - lit@3.0.0-pre.1

## 0.2.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - lit@3.0.0-pre.0
  - @lit-labs/ssr-client@1.1.2-pre.0
  - @lit-labs/ssr@3.1.3-pre.0

## 0.2.1

### Patch Changes

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - Use hydration modules from `@lit-labs/ssr-client`

- Updated dependencies [[`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7)]:
  - @lit-labs/ssr-client@1.1.0

## 0.2.0

### Minor Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - @lit-labs/testing no longer automatically loads the Lit SSR global DOM shim
  when performing SSR, instead relying on newer versions of Lit which automatically
  load necessary shims with minimal global pollution.

  This may cause new or different test failures, because APIs such as `document`
  will no longer be available on the server by default. Use `isServer` from the
  `lit` package to guard against calling such APIs during SSR (see
  https://lit.dev/docs/ssr/authoring/#browser-only-code for more information).

### Patch Changes

- Updated dependencies [[`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`ff637f52`](https://github.com/lit/lit/commit/ff637f52a3c2252e37d6ea6ae352c3c0f35a9e87), [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8), [`c77220e8`](https://github.com/lit/lit/commit/c77220e80bc5b04628776ef8e5828fcde5f8ad16)]:
  - @lit-labs/ssr@3.0.0
  - lit@2.6.0

## 0.1.1

### Patch Changes

- [#3175](https://github.com/lit/lit/pull/3175) [`27e08e5d`](https://github.com/lit/lit/commit/27e08e5d71af85fb5e38bbd968d7a7cb14c12193) - Make resolved paths sent to worker be file urls. Fixes incompatibility with Windows filepaths.

- [#3198](https://github.com/lit/lit/pull/3198) [`0162fbad`](https://github.com/lit/lit/commit/0162fbad61826ba0ff4188135ca4ab778762c4d7) - TS sources are now inlined in the JS source maps

- Updated dependencies [[`daddeb34`](https://github.com/lit/lit/commit/daddeb346a2f454b25a6a5d1722683197f25fbcd), [`6361a4b4`](https://github.com/lit/lit/commit/6361a4b4a589465cf6836c8454ed8ca4521d7b4d), [`ae6f6808`](https://github.com/lit/lit/commit/ae6f6808f539254b72ec7efcff34b812173abe64)]:
  - lit@2.3.0

## 0.1.0

### Minor Changes

- [#2957](https://github.com/lit/lit/pull/2957) [`a2491c34`](https://github.com/lit/lit/commit/a2491c347817fc0c16738630ed8b3980570273d4) - Initial release
