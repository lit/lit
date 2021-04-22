# Change Log

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

- Included `flip-controller` in `package.json` `files` section [#1796](https://github.com/lit/lit/issues/1796).

## [1.0.0-rc.1] - 2021-04-20

### Changed

- Updated dependencies

## [1.0.0-pre.1] - 2020-12-16

### Added

- Adds `flip` directive. The `flip` directive animates a node's layout between renders. It will perform a "tweening" animation between the two states based on the options given. In addition, elements can animate when they initially render to DOM and when they are removed. for making elements move from one render to the next.
- Adds `position` directive that positions and sizes an element relative to a given target element.
