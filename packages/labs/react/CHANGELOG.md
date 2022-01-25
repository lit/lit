# Change Log

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

- Added `useControler()` hook for creating React hooks from Reactive Controllers ([#1532](https://github.com/Polymer/lit-html/pulls/1532)).

## [1.0.0-pre.2] - 2021-03-31

### Changed

- Updated dependencies

## [1.0.0-pre.1] - 2021-02-11

### Added

- Adds React component wrapper for custom elements. Use by calling `createComponent` ([#1420](https://github.com/Polymer/lit-html/pulls/1420)).
