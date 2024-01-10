# Change Log

## 2.1.2

### Patch Changes

- [#4340](https://github.com/lit/lit/pull/4340) [`18305b43`](https://github.com/lit/lit/commit/18305b43f02f2265eaa6570947517d454bb9db4c) - Update dependency version range on graduated package to `^1.0.0` so this package can receive updates.

## 2.1.1

### Patch Changes

- [#4224](https://github.com/lit/lit/pull/4224) [`71526898`](https://github.com/lit/lit/commit/71526898cc33ff8a466b9dcabb89d601ec862b9a) - Graduate @lit-labs/react to @lit/react, its permanent location. @lit-labs/react is now just a proxy for @lit/react, so code need not be duplicated in projects that depend on both.

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

## 2.1.1-pre.0

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#4224](https://github.com/lit/lit/pull/4224) [`71526898`](https://github.com/lit/lit/commit/71526898cc33ff8a466b9dcabb89d601ec862b9a) - Graduate @lit-labs/react to @lit/react, its permanent location. @lit-labs/react is now just a proxy for @lit/react, so code need not be duplicated in projects that depend on both.

- Updated dependencies [[`71526898`](https://github.com/lit/lit/commit/71526898cc33ff8a466b9dcabb89d601ec862b9a)]:
  - @lit/react@1.0.0-pre.0

## 2.1.0

### Minor Changes

- [#4221](https://github.com/lit/lit/pull/4221) [`5a60fbc6`](https://github.com/lit/lit/commit/5a60fbc64c45c4b99f0eb7454fec06de4fcd8e27) Thanks [@rivajunior](https://github.com/rivajunior)! - export Options interface

## 2.0.3

### Patch Changes

- [#4172](https://github.com/lit/lit/pull/4172) [`dc1d323f`](https://github.com/lit/lit/commit/dc1d323f3306214c1dca75ff904a560deaf441fe) - Revert custom children type added in #4142 and instead use our copy of `PropsWithoutRef` type so that `preact/compat` typing will work.
  Preact users facing type errors using wrapped components should configure `"paths"` in their `tsconfig.json` so that `react` types will instead resolve to `preact/compat` as described in [Preact's TypeScript documentation](https://preactjs.com/guide/v10/typescript/#typescript-preactcompat-configuration).
  Going with `preact/compat` also solves compatibility issues arising from [TypeScript >= 5.1 changing JSX tag type check](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-1.html#decoupled-type-checking-between-jsx-elements-and-jsx-tag-types).

## 2.0.2

### Patch Changes

- [#4142](https://github.com/lit/lit/pull/4142) [`170e9164`](https://github.com/lit/lit/commit/170e91648472d21ecee3fca9ac7a0a52787b6e98) - Fix type compatibility with Preact when adding children to wrapped components.

## 2.0.1

### Patch Changes

- [#4097](https://github.com/lit/lit/pull/4097) [`364650d0`](https://github.com/lit/lit/commit/364650d0a3a8f873249e39dacf17ac9e3343b89b) - Fix type regression to prefer provided event handler prop type over React's built-in handler type.

## 2.0.0

### Major Changes

- [#4027](https://github.com/lit/lit/pull/4027) [`c28cb6ed`](https://github.com/lit/lit/commit/c28cb6ed45445fb8cb5e20af5076f3d5ec9f3bea) - - [BREAKING] Removed deprecated call signature for `createComponent()` taking multiple arguments. A single option object must be passed in instead.

  Example:

  ```diff
  - createComponent(React, 'my-element', MyElement, {onfoo: 'foo'})
  + createComponent({
  +   react: React,
  +   tagName: 'my-element',
  +   elementClass: MyElement,
  +   events: {onfoo: 'foo'},
  + })
  ```

  - Refactored to move implementation directly into render function of `forwardRef` rather than creating a class component. This removes an extra React component of the same name showing up in the component tree.

### Patch Changes

- [#4000](https://github.com/lit/lit/pull/4000) [`2118aeb6`](https://github.com/lit/lit/commit/2118aeb6f83d2e0b0afbba5ce486876711658e82) - Add `@types/react@17||18` as peer dependency as the package makes direct use of those types.

- [#4061](https://github.com/lit/lit/pull/4061) [`25d10ee1`](https://github.com/lit/lit/commit/25d10ee1e1299d4ea22e10bf4fae9b370eae05b3) - Update `WebComponentProps` type to allow providing `ref` prop in JSX.

## 1.2.1

### Patch Changes

- [#3978](https://github.com/lit/lit/pull/3978) [`3711e665`](https://github.com/lit/lit/commit/3711e6650a59966e5be8d92dd0abf053d9a50d32) - Only add `suppressHydrationWarning` prop when rendered in the client. This will prevent `suppresshydrationwarning` attribute being added to the host element when using `@lit-labs/ssr-react`.

## 1.2.0

### Minor Changes

- [#3885](https://github.com/lit/lit/pull/3885) [`7932f7dd`](https://github.com/lit/lit/commit/7932f7ddc21308dc0bf7b1bbd0dde781a6c8dece) - `@lit-labs/ssr-react` and `@lit-labs/react` now coordinate prop handling during server rendering and hydration.

  - [Breaking] `@lit-labs/ssr-react` will call `setAttribute()` with all props provided during server rendering unless they are provided in <code>\_$litProps$</code> object made by `@lit-labs/react`. Previously, it would call `setProperty()` for props that were found in the element's prototype, and `setAttribute()` for those that weren't. If you wish to server render custom elements that take properties that can not be set as attributes (i.e. not serializeable or have different name as attribute/property), you must use `@lit-labs/react` to create a React wrapper component.
  - `@lit-labs/react` now has a Node build and export condition to do special prop handling during server rendering. It detects the presence of `React.createElement` monkey patch by `@lit-labs/ssr-react` and provides props to be set as properties to the `createElement()` call.
  - `@lit-labs/ssr-react` will add the `defer-hydration` attribute to custom elements that had properties set so that `@lit-labs/react` wrapped elements have a chance to set properties on the element before Lit element hydration is triggered.
  - `@lit-labs/react` wrapped components will suppress hydration warnings raised by React due to server rendered attributes.

## 1.1.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

## 1.1.1

### Patch Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Add console warning for reserved react properties found on a wrapped web component in dev mode only.

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Filter \_\_forwaredRef from build.

## 1.1.0

### Minor Changes

- [#2988](https://github.com/lit/lit/pull/2988) [`2d10c26d`](https://github.com/lit/lit/commit/2d10c26d6c526faafacc5d28d0f70f671e72560d) - Provide a params object to createComponent to improve developer experience and make it easier to maintain and add future features.

- [#3128](https://github.com/lit/lit/pull/3128) [`491d0e37`](https://github.com/lit/lit/commit/491d0e379dda03787de088b0c4a74b5234ac4940) - Application of react props on web components matches the behavior of setting props on dom elements.

## 1.0.9

### Patch Changes

- [#3163](https://github.com/lit/lit/pull/3163) [`1212ddd0`](https://github.com/lit/lit/commit/1212ddd0744529c294ea3905782917172c5aa11e) - Provide the explicit return type `WrappedWebComponent` for `createComponent`. This exposes an explicit typing for wrapped components rather than relying on inferences from Typescript. A well defined type should provide more resilience for implementations like SSR and others.

## 1.0.8

### Patch Changes

- [#2800](https://github.com/lit/lit/pull/2800) [`043d9c80`](https://github.com/lit/lit/commit/043d9c80de59177335fa6543d5654e0295f5a743) - Support setting custom accessors by using an 'in' check instead of a for/in loop to check for properties.

## 1.0.7

### Patch Changes

- [#3072](https://github.com/lit/lit/pull/3072) [`94722633`](https://github.com/lit/lit/commit/947226339746d5795a8ded3d19d51d3d6fdf7b0e) - Avoid nested component props type declarations. Incrementally define what types are needed rather than nesting.

- [#3067](https://github.com/lit/lit/pull/3067) [`f3e3cddf`](https://github.com/lit/lit/commit/f3e3cddf5e03602558c92306ed4fc0234767ac39) - Fixed an error that occurs when compiling TS. The error occurs when createComponent() is not provided an event map causing instance properties to be confused with event handlers.

- [#3111](https://github.com/lit/lit/pull/3111) [`6158482c`](https://github.com/lit/lit/commit/6158482c4123d74c29eb1ba2307c5aa2d059c041) - Removed the unexposed and unnecessary `StringValued` type used to correlate property names with event listener names.

- [#3132](https://github.com/lit/lit/pull/3132) [`2fe2053f`](https://github.com/lit/lit/commit/2fe2053fe04e7226e5fa4e8b730e91a62a547b27) - Added "types" entry to package exports. This tells newer versions of TypeScript where to look for typings for each module.

## 1.0.6

### Patch Changes

- [#3050](https://github.com/lit/lit/pull/3050) [`5227ca52`](https://github.com/lit/lit/commit/5227ca52863ac6fd9f3ee57d7a6c78ea1e617b56) - Fix a property collision in the minified production build.

## 1.0.5

### Patch Changes

- [#2987](https://github.com/lit/lit/pull/2987) [`93b30f7d`](https://github.com/lit/lit/commit/93b30f7de81eb203ad88abfc1e0e87a719d132c5) - [labs/react] `useController` is compatible with React strict mode.

- [#2960](https://github.com/lit/lit/pull/2960) [`16a900c7`](https://github.com/lit/lit/commit/16a900c7d0191140a65cdb38126ab3653c334935) - Fix `'@lit-labs/react/use-controller.js'` not being correctly exported from package.json.

## 1.0.4

### Patch Changes

- [#2678](https://github.com/lit/lit/pull/2678) [`80e701e2`](https://github.com/lit/lit/commit/80e701e25cfac71d220acb646c6f4964c829de84) - Skip the \_\_forwardedRef when passing component props to element.

## 1.0.3

### Patch Changes

- [#2648](https://github.com/lit/lit/pull/2648) [`7cb492a3`](https://github.com/lit/lit/commit/7cb492a37352ea2402f783bf83fa0bef7ed29036) - Event callbacks can be typed by casting with EventHandler

## 1.0.2

### Patch Changes

- [#2410](https://github.com/lit/lit/pull/2410) [`b9a6962b`](https://github.com/lit/lit/commit/b9a6962b84c841eaabd5c4cbf8687ff34dbfe511) - Correct the link path of CONTRIBUTING.md in README.md files

## 1.0.1

### Patch Changes

- [#2155](https://github.com/lit/lit/pull/2155) [`55cc9df4`](https://github.com/lit/lit/commit/55cc9df43f8702bf2b530fa9d70b2a2951f83de8) - Fix displayName of components created with "createComponent"

## 1.0.0

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

- [#2123](https://github.com/lit/lit/pull/2123) [`efe88ba5`](https://github.com/lit/lit/commit/efe88ba5a31bae117f8a4c8ddf111068368cf249) - Adds React.HTMLAttributes to component props, which enables the built-in `onXyz` event handler props.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

## 1.0.0-rc.4

### Patch Changes

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

* [#2123](https://github.com/lit/lit/pull/2123) [`efe88ba5`](https://github.com/lit/lit/commit/efe88ba5a31bae117f8a4c8ddf111068368cf249) - Adds React.HTMLAttributes to component props, which enables the built-in `onXyz` event handler props.

## 1.0.0-rc.3

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

---

Changes below were based on the [Keep a Changelog](http://keepachangelog.com/) format. All changes above are generated automatically by [Changesets](https://github.com/atlassian/changesets).

---

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [x.y.z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Removed -->
<!-- ### Fixed -->

## Unreleased

### Fixed

- Included `development` folder in release [#1912](https://github.com/lit/lit/issues/1912).

## [1.0.0-rc.2] - 2021-05-07

### Fixed

- Fixed a bug where `host.requestUpdate()` only worked on the first call from within `useController()`.

## [1.0.0-rc.1] - 2021-04-20

### Added

- Added `useController()` hook for creating React hooks from Reactive Controllers ([#1532](https://github.com/Polymer/lit-html/pulls/1532)).

## [1.0.0-pre.2] - 2021-03-31

### Changed

- Updated dependencies

## [1.0.0-pre.1] - 2021-02-11

### Added

- Adds React component wrapper for custom elements. Use by calling `createComponent` ([#1420](https://github.com/Polymer/lit-html/pulls/1420)).
