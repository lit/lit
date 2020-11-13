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

- UpdatingElement's `renderRoot` is now created when the element's `connectedCallback` is initially run.

- [Breaking] Update callbacks will only be called when the element is connected
  to the document. If an element is disconnected while an update is pending, or
  if an update is requested while the element is disconnected, update callbacks
  will be called if/when the element is re-connected.

### Added

- Added ability to add a controller to an element. A controller can implement callbacks that tie into element lifecycle, including `connectedCallback`, `disconnectedCallback`, `willUpdate`, `update`, and `updated`. To ensure it has access to the element lifecycle, a controller should be added in the element's constructor. To add a controller to the element, call `addController(controller)`.

- Added `willUpdate(changedProperties)` lifecycle method to UpdatingElement. This is called before the `update` method and can be used to compute derived state needed for updating. This method is intended to be called during server side rendering and should not manipulate element DOM.

- UpdatingElement moved from `lit-element` package to `updating-element` package.

### Fixed

- Fixes an issue with `queryAssignedNodes` when applying a selector on a slot that included text nodes on older browsers not supporting Element.matches [#1088](https://github.com/Polymer/lit-element/issues/1088).
