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

- Errors that occur during the update cycle were previously squelched to allow subsequent updates to proceed normally. Now errors are re-fired asynchronously so they can be detected. Errors can be observed via an `unhandledrejection` event handler on window.

### Added

- Console warnings added for removed API and other element problems in developer mode. Some warnings are errors and are always issued while others are optional. Optional warnings can be configured per class via `MyElement.enable/disableWarning`. Making changes in update warns by default and can be toggled via `MyElement.disableWarning('change-in-update)`; migration warnings are off by default and can be toggled via `MyElement.enableWarning('migration')`.
- UpdatingElement moved from `lit-element` package to `updating-element` package.

### Fixed

- Fixes an issue with `queryAssignedNodes` when applying a selector on a slot that included text nodes on older browsers not supporting Element.matches [#1088](https://github.com/Polymer/lit-element/issues/1088).
