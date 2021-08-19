# Change Log

## 1.0.0-rc.3

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* Updated dependencies [[`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - lit@2.0.0-rc.3

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

## [1.0.0-rc.2] - 2021-04-07

### Fixed

- Included `flip-controller` in `package.json` `files` section [#1796](https://github.com/lit/lit/issues/1796).

## [1.0.0-rc.1] - 2021-04-20

### Changed

- Updated dependencies

## [1.0.0-pre.1] - 2020-12-16

### Added

- Adds `flip` directive. The `flip` directive animates a node's layout between renders. It will perform a "tweening" animation between the two states based on the options given. In addition, elements can animate when they initially render to DOM and when they are removed. for making elements move from one render to the next.
- Adds `position` directive that positions and sizes an element relative to a given target element.
