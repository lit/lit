## [0.7.0] - 2022-04-04

## 0.7.1

### Patch Changes

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Upgrade tslib version

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Upgrade event-target-shim

- [#3133](https://github.com/lit/lit/pull/3133) [`36db238c`](https://github.com/lit/lit/commit/36db238ce5ae53a3bfe656b5cb57856b0ac9ed3f) - The virtualize directive will now correctly re-render children when data stored outside the items array has changed.

### Changed

- The `scroll` directive has been renamed to `virtualize`. Note that the `<lit-virtualizer>` element remains the recommended way to use virtualizer in most cases; the directive exists primarily for developers who are using Lit's `lit-html` templating system standalone and don't need the `LitElement` base class elsewhere in their project.

- By default, a virtualizer instance is no longer itself a scroller; rather, it is a block-level container that:

  - Determines its own size by calculating or estimating the total size of all of its children (both those that are currently in the DOM and those that are not)
  - Adds and removes children from the DOM as the visible portion of the virtualizer changes (i.e., when any of its containing ancestors, including the window, is scrolled, resized, etc.).

  If you want to make a `<lit-virtualizer>` element into a scroller, you can do so by adding the `scroller` attribute; likewise, you can set `scroller: true` if you're using the `virtualize` directive.

  As a result of this change, the `scrollTarget` property / attribute is no longer needed and has been removed.

- In `0.5` and `0.6`, it was necessary to explicitly specify a layout. In `0.7`, we revert to the behavior from earlier versions: if you don't specify a layout, the default layout (previously called `Layout1d`, now called `flow`—see below) will be used (and loaded dynamically as needed).

- The lineup of layouts has been updated and cleaned up. The default layout, previously called `Layout1d`, is now called `flow`. The previous, rudimentary grid layouts have been replaced with a single, new `grid` layout with some options to control its behavior. The `Layout1dFlex` layout has been renamed to `flexWrap` and remains a work in progress, not yet fully usable (though getting close).

- The syntax for specifying layouts has changed; rather than providing a layout constructor (e.g., `FlowLayout`) or a configuration object containing the required type property (e.g. `{type: FlowLayout, direction: ‘horizontal’}`), you now import a layout as a function and call that function (passing it an optional configuration object as desired). For example:

  ```
  <lit-virtualizer
    .layout=${flow({
      direction: ‘horizontal’
    })
  ></lit-virtualizer>
  ```

- The `spacing` property of the default layout (which has been present since the earliest releases but never documented) has been removed. Setting margins on the child elements you render is the way to control spacing. This margin-based method was already supported and recommended / demonstrated in previous versions, but has been improved in `0.7` with basic support for margin-collapsing: margins set explicitly on child elements will now be collapsed, but any margins on elements contained within child elements are not considered. If you were relying on the previous (non-collapsing) behavior, you may need to adjust existing style rules.

- In another return to pre-`0.5` behavior, the `visibilityChanged` and `rangeChanged` events are no longer `CustomEvent`s, so you’ll access their properties directly from the event object, not from under a `details` property. Additionally, these event objects no longer contain both range and visibility information; rather, `visibilityChanged` reports only visibility changes and `rangeChanged` reports only range changes. Both event objects have just two properties: `first` and `last`.

- Inline API docs are still minimal, but types for `<lit-virtualizer>`, the `virtualize` directive and the various layouts are essentially correct and complete, so typeahead / autocomplete should work if your editor has these features.

- Exports from the `@lit-labs/virtualizer` packaged are now restricted by an export map. If you have been importing from any modules not intended to be part of the current public API (or if we have inadvertently left something out of the map), things may break—please file issues as needed.

- The LitVirtualizer class has been extracted into a separate file (`LitVirtualizer.js`) so that, if necessary, it can be imported without registering the `<lit-virtualizer>` custom element as a side effect.

### Fixed

- Scrolling issue on iOS ([#54](https://github.com/PolymerLabs/uni-virtualizer/issues/54))
- Incorrect index passed to `renderItem()` function ([#109](https://github.com/PolymerLabs/uni-virtualizer/issues/109))
- Undocumented change: doesn't work unless layout is explicitly specified ([#103](https://github.com/PolymerLabs/uni-virtualizer/issues/103))
- Runtime error when rendering after the number of items is reduced ([#111](https://github.com/PolymerLabs/uni-virtualizer/issues/111))

The following are also believed to be fixed, but didn't have specific repro cases to test against so require confirmation:

- Scroll listeners on `window` not removed ([#55](https://github.com/PolymerLabs/uni-virtualizer/issues/55))
- Doesn't always reflow when items change ([#75](https://github.com/PolymerLabs/uni-virtualizer/issues/75))
- Hangs / freezes when switching between virtualizer instances ([#105](https://github.com/PolymerLabs/uni-virtualizer/issues/105))
- Scrolling issue under certain circumstances when `items` array changes ([#108](https://github.com/PolymerLabs/uni-virtualizer/issues/108))

## [0.7.0-pre.3] - 2022-03-22

### Changed

- Extracted LitVirtualizer class to be imported without side-effects

### Fixed

- Runtime error when rendering after the number of items is reduced ([#111](https://github.com/PolymerLabs/uni-virtualizer/issues/111))

## [0.7.0-pre.2] - 2021-10-08

### Changed

- The `scroll` directive has been renamed to `virtualize`. Note that the `<lit-virtualizer>` element remains the recommended way to use virtualizer in most cases; the directive exists primarily for developers who are using Lit's `lit-html` templating system standalone and don't need the `LitElement` base class elsewhere in their project.

- By default, a virtualizer instance is no longer itself a scroller; rather, it is a block-level container that:

  - Determines its own size by calculating or estimating the total size of all of its children (both those that are currently in the DOM and those that are not)
  - Adds and removes children from the DOM as the visible portion of the virtualizer changes (i.e., when any of its containing ancestors, including the window, is scrolled, resized, etc.).

  If you want to make a `<lit-virtualizer>` element into a scroller, you can do so by adding the `scroller` attribute; likewise, you can set `scroller: true` if you're using the `virtualize` directive.

  As a result of this change, the `scrollTarget` property / attribute is no longer needed and has been removed.

- In `0.5` and `0.6`, it was necessary to explicitly specify a layout. In `0.7`, we revert to the behavior from earlier versions: if you don't specify a layout, the default layout (previously called `Layout1d`, now called `flow`—see below) will be used (and loaded dynamically as needed).

- The lineup of layouts has been updated and cleaned up. The default layout, previously called `Layout1d`, is now called `flow`. The previous, rudimentary grid layouts have been replaced with a single, new `grid` layout with some options to control its behavior. The `Layout1dFlex` layout has been renamed to `flexWrap` and remains a work in progress, not yet fully usable (though getting close).

- The syntax for specifying layouts has changed; rather than providing a layout constructor (e.g., `FlowLayout`) or a configuration object containing the required type property (e.g. `{type: FlowLayout, direction: ‘horizontal’}`), you now import a layout as a function and call that function (passing it an optional configuration object as desired). For example:

  ```
  <lit-virtualizer
    .layout=${flow({
      direction: ‘horizontal’
    })
  ></lit-virtualizer>
  ```

- The `spacing` property of the default layout (which has been present since the earliest releases but never documented) has been removed. Setting margins on the child elements you render is the way to control spacing. This margin-based method was already supported and recommended / demonstrated in previous versions, but has been improved in `0.7` with basic support for margin-collapsing: margins set explicitly on child elements will now be collapsed, but any margins on elements contained within child elements are not considered. If you were relying on the previous (non-collapsing) behavior, you may need to adjust existing style rules.

- In another return to pre-`0.5` behavior, the `visibilityChanged` and `rangeChanged` events are no longer `CustomEvent`s, so you’ll access their properties directly from the event object, not from under a `details` property. Additionally, these event objects no longer contain both range and visibility information; rather, `visibilityChanged` reports only visibility changes and `rangeChanged` reports only range changes. Both event objects have just two properties: `first` and `last`.

- Inline API docs are still minimal, but types for `<lit-virtualizer>`, the `virtualize` directive and the various layouts are essentially correct and complete, so typeahead / autocomplete should work if your editor has these features.

- Exports from the `@lit-labs/virtualizer` packaged are now restricted by an export map. If you have been importing from any modules not intended to be part of the current public API (or if we have inadvertently left something out of the map), things may break—please file issues as needed.

### Fixed

- Scrolling issue on iOS ([#54](https://github.com/PolymerLabs/uni-virtualizer/issues/54))
- Incorrect index passed to `renderItem()` function ([#109](https://github.com/PolymerLabs/uni-virtualizer/issues/109))
- Undocumented change: doesn't work unless layout is explicitly specified ([#103](https://github.com/PolymerLabs/uni-virtualizer/issues/103))

The following are also believed to be fixed, but didn't have specific repro cases to test against so require confirmation:

- Scroll listeners on `window` not removed ([#55](https://github.com/PolymerLabs/uni-virtualizer/issues/55))
- Doesn't always reflow when items change ([#75](https://github.com/PolymerLabs/uni-virtualizer/issues/75))
- Hangs / freezes when switching between virtualizer instances ([#105](https://github.com/PolymerLabs/uni-virtualizer/issues/105))
- Scrolling issue under certain circumstances when `items` array changes ([#108](https://github.com/PolymerLabs/uni-virtualizer/issues/108))

## [0.6.0] - 2021-05-01

- This is a stopgap release to unblock migrations to Lit 2.0
- In the near future:
  - Source will move to the Lit monorepo
  - Subsequent releases will likely be as `@lit-labs/virtualizer`

### Changed

- Migrated to Lit 2.x

## [0.5.0] - 2021-05-01

### Changed

- Significant refactoring
- Now emits custom events, access data from `detail` object

### Added

- Support for older browsers (IE11, legacy Edge)
- Benchmarking support (subject to change)
- Work-in-progress grid layouts, not ready for use

## [0.4.2] - 2019-11-15

### Changed

- Appended `.js` to all local imports.
- Capitalized `Layout` import in Layout1dBase.

## [0.4.1] - 2019-09-24

### Changed

- Rollup plugins moved to dev dependencies.
- Bumped rollup-plugin-terser version.

## [0.4.0] - 2019-08-19

### Added

- Type declarations.

### Fixed

- lit-html and LitElement versions.

## [0.3.0] - 2019-07-18

### Added

- `firstVisible` and `lastVisible` on `RangeChangeEvent`.

## [0.2.0] - 2019-07-15

### Added

- `scrollToIndex` method on `<lit-virtualizer>`.
- `scrollToIndex` configuration option on `scroll` directive.

### Changed

- Renamed API option `template` to `renderItem`.

## [0.1.0] - 2019-06-05

- Initial prerelease.
