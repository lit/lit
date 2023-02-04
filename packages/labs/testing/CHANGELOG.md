# @lit-labs/testing

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
