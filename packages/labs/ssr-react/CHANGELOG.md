# @lit-labs/ssr-react

## 0.2.0

### Minor Changes

- [#3885](https://github.com/lit/lit/pull/3885) [`7932f7dd`](https://github.com/lit/lit/commit/7932f7ddc21308dc0bf7b1bbd0dde781a6c8dece) - `@lit-labs/ssr-react` and `@lit-labs/react` now coordinate prop handling during server rendering and hydration.

  - [Breaking] `@lit-labs/ssr-react` will call `setAttribute()` with all props provided during server rendering unless they are provided in <code>\_$litProps$</code> object made by `@lit-labs/react`. Previously, it would call `setProperty()` for props that were found in the element's prototype, and `setAttribute()` for those that weren't. If you wish to server render custom elements that take properties that can not be set as attributes (i.e. not serializeable or have different name as attribute/property), you must use `@lit-labs/react` to create a React wrapper component.
  - `@lit-labs/react` now has a Node build and export condition to do special prop handling during server rendering. It detects the presence of `React.createElement` monkey patch by `@lit-labs/ssr-react` and provides props to be set as properties to the `createElement()` call.
  - `@lit-labs/ssr-react` will add the `defer-hydration` attribute to custom elements that had properties set so that `@lit-labs/react` wrapped elements have a chance to set properties on the element before Lit element hydration is triggered.
  - `@lit-labs/react` wrapped components will suppress hydration warnings raised by React due to server rendered attributes.

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
