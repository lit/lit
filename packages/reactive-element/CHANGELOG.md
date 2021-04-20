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

## 1.0.0-rc.1 - 2021-04-20

### Fixed

- (Since 1.0.0-pre.3) A controller's `hostConnected` is called only once if an element is upgraded to a custom element [#1731](https://github.com/Polymer/lit-html/issues/1731).

## 1.0.0-pre.3 - 2021-03-31

### Fixed

- (Since 1.0.0-pre.2) The `createRenderRoot` method is now called only once [#1679](https://github.com/Polymer/lit-html/issues/1679).

## [1.0.0-pre.2] - 2021-02-11

### Added

- (Since 1.0.0-pre.1) Adds `static addInitializer` for adding a function which is called with the element instance when is created. This can be used, for example, to create decorators which hook into element lifecycle by creating a reactive controller ([#1663](https://github.com/Polymer/lit-html/issues/1663)).
- (Since 1.0.0-pre.1) Added `removeController(controller)` which can be used to remove a controller from a `ReactiveElement`.

### Changed

- (Since 1.0.0-pre.1) A controller's `hostUpdated` method is now called before the host's `firstUpdated` method ([#1650](https://github.com/Polymer/lit-html/issues/1650)).
- (Since 1.0.0-pre.1) Fixed `@query` decorator when cache flag is used and code is compiled with Babel ([#1591](https://github.com/Polymer/lit-html/pull/1591)).

- (Since 1.0.0-pre.1) Renamed all decorator modules to use kebab-case filename convention rather than camelCase.
- (Since 1.0.0-pre.1) `ReactiveController` callbacks all now begin with `host`, for example `hostConnected`, `hostDisconnected`, `hostUpdate`, `hostUpdated`.
- (Since 1.0.0-pre.1) If a `Controller` is added after a host element is connected, its `connected` will be called.
- (Since 1.0.0-pre.1) Removed `willUpdate` from `ReactiveController`.
- (Since 1.0.0-pre.1) Renamed `Controller`'s `dis/connectedCallback` methods.
- (Since 1.0.0-pre.1) Renamed `Controller` to `ReactiveController`.
- Made JSCompiler_renameProperty block scoped so that it's inlined in the Terser prod build. Closure should compile from the development build, or after a custom TypeScript compilation.

## [1.0.0-pre.1] - 2020-12-16

### Changed

- [Breaking] (since 3.0.0-pre1) `UpdatingElement` has been renamed to `ReactiveElement`.
- [Breaking] (since 3.0.0-pre1) The `updating-element` package has been renamed to `@lit/reactive-element`.
- [Breaking] (since 3.0.0-pre1) The `@internalProperty` decorator has been renamed to `@state`.
- [Breaking] For consistency, renamed `_getUpdateComplete` to `getUpdateComplete`.
- [Breaking] When a property declaration is `reflect: true` and its `toAttribute` function returns `undefined` the attribute is now removed where previously it was left unchanged ([#872](https://github.com/Polymer/lit-element/issues/872)).
- Errors that occur during the update cycle were previously squelched to allow subsequent updates to proceed normally. Now errors are re-fired asynchronously so they can be detected. Errors can be observed via an `unhandledrejection` event handler on window.

- UpdatingElement's `renderRoot` is now created when the element's `connectedCallback` is initially run.

- [Breaking] Update callbacks will only be called when the element is connected
  to the document. If an element is disconnected while an update is pending, or
  if an update is requested while the element is disconnected, update callbacks
  will be called if/when the element is re-connected.

### Added

- Console warnings added for removed API and other element problems in developer mode. Some warnings are errors and are always issued while others are optional. Optional warnings can be configured per class via `MyElement.enable/disableWarning`. Making changes in update warns by default and can be toggled via `MyElement.disableWarning('change-in-update)`; migration warnings are off by default and can be toggled via `MyElement.enableWarning('migration')`.

- Added ability to add a controller to an element. A controller can implement callbacks that tie into element lifecycle, including `connectedCallback`, `disconnectedCallback`, `willUpdate`, `update`, and `updated`. To ensure it has access to the element lifecycle, a controller should be added in the element's constructor. To add a controller to the element, call `addController(controller)`.

- Added `willUpdate(changedProperties)` lifecycle method to UpdatingElement. This is called before the `update` method and can be used to compute derived state needed for updating. This method is intended to be called during server side rendering and should not manipulate element DOM.

- UpdatingElement moved from `lit-element` package to `updating-element` package.

### Removed

- [Breaking] Removed `requestUpdateInternal`. The `requestUpdate` method is now identical to this method and should be used instead.
- [Breaking] The `initialize` method has been removed. This work is now done in the element constructor.

### Fixed

- Fixes an issue with `queryAssignedNodes` when applying a selector on a slot that included text nodes on older browsers not supporting Element.matches [#1088](https://github.com/Polymer/lit-element/issues/1088).
