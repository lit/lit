# @lit-labs/ssr-react

## 0.2.2

### Patch Changes

- [#4311](https://github.com/lit/lit/pull/4311) [`cabe72a8`](https://github.com/lit/lit/commit/cabe72a863a5de14a4bbca384374db748dd9b4c5) - Removed `lit` package from dependency. It is now listed as a dev dependency since it is only used for testing.

## 0.2.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies:
  - lit@3.0.0

## 0.2.1-pre.0

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`77e9b48e`](https://github.com/lit/lit/commit/77e9b48e4aefc61d5fe31939019c281d7303137c), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit-labs/ssr@3.1.8-pre.0
  - lit@3.0.0-pre.1

## 0.2.0

### Minor Changes

- [#3885](https://github.com/lit/lit/pull/3885) [`7932f7dd`](https://github.com/lit/lit/commit/7932f7ddc21308dc0bf7b1bbd0dde781a6c8dece) - `@lit-labs/ssr-react` and `@lit-labs/react` now coordinate prop handling during server rendering and hydration.

  - [Breaking] `@lit-labs/ssr-react` will call `setAttribute()` with all props provided during server rendering unless they are provided in <code>\_$litProps$</code> object made by `@lit-labs/react`. Previously, it would call `setProperty()` for props that were found in the element's prototype, and `setAttribute()` for those that weren't. If you wish to server render custom elements that take properties that can not be set as attributes (i.e. not serializeable or have different name as attribute/property), you must use `@lit-labs/react` to create a React wrapper component.
  - `@lit-labs/react` now has a Node build and export condition to do special prop handling during server rendering. It detects the presence of `React.createElement` monkey patch by `@lit-labs/ssr-react` and provides props to be set as properties to the `createElement()` call.
  - `@lit-labs/ssr-react` will add the `defer-hydration` attribute to custom elements that had properties set so that `@lit-labs/react` wrapped elements have a chance to set properties on the element before Lit element hydration is triggered.
  - `@lit-labs/react` wrapped components will suppress hydration warnings raised by React due to server rendered attributes.

## 0.1.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - lit@3.0.0-pre.0
  - @lit-labs/ssr-client@1.1.2-pre.0
  - @lit-labs/ssr@3.1.3-pre.0

## 0.1.2

### Patch Changes

- [#3861](https://github.com/lit/lit/pull/3861) [`8deca6e6`](https://github.com/lit/lit/commit/8deca6e66ebc0bf22a82d58f0470e621a55ff1b0) - Handle children passed in via props

## 0.1.1

### Patch Changes

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - Use hydration modules from `@lit-labs/ssr-client`

- Updated dependencies [[`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7)]:
  - @lit-labs/ssr-client@1.1.0

## 0.1.0

### Minor Changes

- [#3605](https://github.com/lit/lit/pull/3605) [`b731bb5e`](https://github.com/lit/lit/commit/b731bb5e6d07af2e0ca2de911b781fa3794231cd) - Initial release of `@lit-labs/ssr-react` package.

  This package contains tools to deeply server render Lit components being used in React projects.

### Patch Changes

- Updated dependencies [[`f2eb9796`](https://github.com/lit/lit/commit/f2eb97962c7e77373b3b8861ab59639de22da3d0), [`ca74ff6e`](https://github.com/lit/lit/commit/ca74ff6eda710b929ca7aaf759a98cdfa350cc0d), [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f), [`a5a584d5`](https://github.com/lit/lit/commit/a5a584d5b935f85cef4cbb8c9ff95cae34a8f41c), [`61ec3dab`](https://github.com/lit/lit/commit/61ec3dab761e379c65f9e27946e53137da83fb58), [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544)]:
  - @lit-labs/ssr@3.1.0
  - lit@2.7.0
