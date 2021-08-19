# Change Log

## 1.0.0-rc.3

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

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
