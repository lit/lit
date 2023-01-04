# @lit-labs/virtualizer

## 1.0.1

### Patch Changes

- [#3519](https://github.com/lit/lit/pull/3519) [`393e30cf`](https://github.com/lit/lit/commit/393e30cf7c7f97712e524df34e7343147055fc5d) - Fix [#3481: Error when immediately re-rendering](https://github.com/lit/lit/issues/3481)

- [#3519](https://github.com/lit/lit/pull/3519) [`393e30cf`](https://github.com/lit/lit/commit/393e30cf7c7f97712e524df34e7343147055fc5d) - Fix [#3518: New layoutComplete promise created instead of using existing one](https://github.com/lit/lit/issues/3518)

- [#3525](https://github.com/lit/lit/pull/3525) [`0b67553d`](https://github.com/lit/lit/commit/0b67553d13da43b4039359d4c8c4ef82f0302a4a) - Fix [#3493: Doesn't update on scroll when a clipping ancestor is in Shadow DOM](https://github.com/lit/lit/issues/3493)

- [#3527](https://github.com/lit/lit/pull/3527) [`feb2494d`](https://github.com/lit/lit/commit/feb2494dee3f6f1c907fd432023955fc5f040e28) - Added missing "events.js.map" sourcemap file.

## 1.0.0

_NOTE: As of this release, virtualizer is moving away from 0.x-based versioning to signify prereleases and adopting standard SemVer major/minor/patch semantics. The fact that this release is numbered 1.0 has no special significance._

### Major Changes

- [#3183](https://github.com/lit/lit/pull/3183) [`fd7d86a5`](https://github.com/lit/lit/commit/fd7d86a5001ab38aadf7c474848d8c65f10b156d)
  - Significantly overhaul scrolling implementation
    - Make smooth scrolling work as seamlessly as possible
    - Make the API for scrolling to a virtualizer child element more like the corresponding native API
    - Add a `pin` option to layouts: declaratively specify scroll position relative to a given child element
  - Make `<lit-virtualizer>` use the `virtualize()` directive under the hood, restoring original factoring and reducing duplication
  - Standardize on one way to specify layout (factory function + config object), removing support for older (mostly never documented) options
  - Add `layoutComplete` promise that resolves when virtualizer thinks it is done with a layout / render cycle (intended primarily for testing purposes)
  - Fix [#3290: Export virtualizerRef symbol](https://github.com/lit/lit/issues/3290)
  - Fix [#3491: keyFunction based on index doesn't work properly](https://github.com/lit/lit/issues/3491)
  - Fix [#3492: Grid layout scrollSize calculated incorrectly when padding doesn't match gap](https://github.com/lit/lit/issues/3492)

### Minor Changes

- [#3263](https://github.com/lit/lit/pull/3263) [`4271dffa`](https://github.com/lit/lit/commit/4271dffaac2126d9b1147f87208dd3aa9c59e129)

  - Add experimental masonry layout (API and behavior subject to change)
  - Fix [#3342: Gap miscalculation in grid base layout](https://github.com/lit/lit/issues/3342)

- [#3501](https://github.com/lit/lit/pull/3501) [`3262c80f`](https://github.com/lit/lit/commit/3262c80f5fa396f95515cb40e01f743f4c224f7e) - Fix [#3498: Scrolling to element with 'nearest' option differs from native behavior](https://github.com/lit/lit/issues/3498)

### Patch Changes

- [#3430](https://github.com/lit/lit/pull/3430) [`412b05e7`](https://github.com/lit/lit/commit/412b05e78781a2a7c139a1bbdc1ce6f38ca6c0e6) - Added an events.js module to enable exporting of RangeChangedEvent and VisibilityChangedEvent classes

- [#3424](https://github.com/lit/lit/pull/3424) [`005c68fa`](https://github.com/lit/lit/commit/005c68fa656dd2f96ffdd4c05ef59aa7679193df) - Fix [#3400: Calculates size incorrectly when a scrolling ancestor has padding](https://github.com/lit/lit/issues/3400)

- [#3501](https://github.com/lit/lit/pull/3501) [`3262c80f`](https://github.com/lit/lit/commit/3262c80f5fa396f95515cb40e01f743f4c224f7e) - Fix [#3243: DOM update doesn't successfully complete under some circumstances](https://github.com/lit/lit/issues/3243)

- [#3489](https://github.com/lit/lit/pull/3489) [`f5065f52`](https://github.com/lit/lit/commit/f5065f527999e48c42c15169cac4293ea1bbf0d7) - Added a shim for deprecated scrollToIndex API, to be removed in a future version

- Updated dependencies [[`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d)]:
  - lit@2.5.0

## 0.7.2

### Patch Changes

- [#3215](https://github.com/lit/lit/pull/3215) [`ecdb3bcd`](https://github.com/lit/lit/commit/ecdb3bcd311772e227f6e2b8e73614471ddf2682) - Exported RangeChangedEvent and VisibilityChangedEvent from main module.

## 0.7.1

### Patch Changes

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Upgrade tslib version

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Upgrade event-target-shim

- [#3133](https://github.com/lit/lit/pull/3133) [`36db238c`](https://github.com/lit/lit/commit/36db238ce5ae53a3bfe656b5cb57856b0ac9ed3f) - The virtualize directive will now correctly re-render children when data stored outside the items array has changed.

## [0.7.0] - 2022-04-04

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
