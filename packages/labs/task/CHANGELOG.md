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

### Changed

- Added result and dependency type arguments to Task

### Added

- Added an `initialState` sentinal value that task functions can return to reset the task state to INITIAL.

<!-- ### Removed -->
<!-- ### Fixed -->

## [1.0.0-pre.1] - 2021-02-11

### Added

- Adds `Task` controller which can be used to perform tasks when a host element updates. When the task completes, an update is requested on the host element and the task value can be used as desired ([#1489](https://github.com/Polymer/lit-html/pulls/1489)).
