# @lit-labs/virtualizer

## 2.0.15

### Patch Changes

- [#4807](https://github.com/lit/lit/pull/4807) [`1eb179f6`](https://github.com/lit/lit/commit/1eb179f69d663440fd2ebd3589b6f2808d87494f) Thanks [@graynorton](https://github.com/graynorton)! - Fix case where items in a hidden Virtualizer were being rendered

## 2.0.14

### Patch Changes

- [#4687](https://github.com/lit/lit/pull/4687) [`8ecf3c03`](https://github.com/lit/lit/commit/8ecf3c03d73486e2529c553e92ef4f044c49aab9) Thanks [@alanbuzek](https://github.com/alanbuzek)! - Fix a null pointer exception when virtulizer component is destroyed and then recreated again quickly.

- Updated dependencies [[`feccc1ba`](https://github.com/lit/lit/commit/feccc1ba8e82b36d07a0e2576381bf2819926b98)]:
  - lit@3.2.0

## 2.0.13

### Patch Changes

- [#4564](https://github.com/lit/lit/pull/4564) [`6b4b45ff`](https://github.com/lit/lit/commit/6b4b45ffee88e546110a31f946f27eafe364fa42) Thanks [@IMinchev64](https://github.com/IMinchev64)! - Guard top-level `window` with `typeof` check so that importing the code will not throw when imported in non-browser environments without a global `window` defined. Note, this on its own will not server render items inside the virtualizer, but it will no longer error when attempting to do so.

## 2.0.12

### Patch Changes

- [#4427](https://github.com/lit/lit/pull/4427) [`a19a60b8`](https://github.com/lit/lit/commit/a19a60b84c092ed974e5d294a2ece46f4b43dcd4) Thanks [@pdesoyres-cc](https://github.com/pdesoyres-cc)! - Now correctly include `/support/method-interception.js` and `/support/resize-observer-errors.js` artifacts to the published package. Previously these were listed in the package exports but not actually included with the npm published package.

## 2.0.11

### Patch Changes

- [#4375](https://github.com/lit/lit/pull/4375) [`449bc281`](https://github.com/lit/lit/commit/449bc2815593e8150b0737ed0190ba2c9843ba66) Thanks [@graynorton](https://github.com/graynorton)! - Fix issue where virtualizer didn't render children when slotted into a position:fixed ancestor (#4346)

- Updated dependencies [[`bf551b5b`](https://github.com/lit/lit/commit/bf551b5bdc816c1b0117ab436c50390ae3f5686d), [`949a5467`](https://github.com/lit/lit/commit/949a54677748a1f83ec4d166bd40e244de3afda7), [`c7922a0c`](https://github.com/lit/lit/commit/c7922a0cb90075a9e4c72f93078e411a303c54d1), [`839ca0f8`](https://github.com/lit/lit/commit/839ca0f81a451fbaae97d958aafcaf4c52df9b65)]:
  - lit@3.1.0

## 2.0.10

### Patch Changes

- [#4355](https://github.com/lit/lit/pull/4355) [`21c9faf5`](https://github.com/lit/lit/commit/21c9faf5af69a9871b53328466ea64cfa63768b5) Thanks [@graynorton](https://github.com/graynorton)! - Fix masonry layout bug (new failure case for #3815)

## 2.0.9

### Patch Changes

- [#4291](https://github.com/lit/lit/pull/4291) [`81806d4c`](https://github.com/lit/lit/commit/81806d4cf7052f90473ce4af58e8c7cbc487a900) Thanks [@graynorton](https://github.com/graynorton)! - Update version range for lit dependency to include Lit 2 and 3

- [#4233](https://github.com/lit/lit/pull/4233) [`f84963d8`](https://github.com/lit/lit/commit/f84963d80f890f6ddaa46720622dcc366663cb6a) Thanks [@steverep](https://github.com/steverep)! - Guard against layout updates or re-observing when disconnected (fixes #4182, #3831)

## 2.0.8

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies:
  - lit@3.0.0

## 2.0.8-pre.0

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - lit@3.0.0-pre.1

## 2.0.7

### Patch Changes

- [#4130](https://github.com/lit/lit/pull/4130) [`d7bd030b`](https://github.com/lit/lit/commit/d7bd030b5b2a285ae9443a4daadecf0029b50b18) Thanks [@graynorton](https://github.com/graynorton)! - Fix bug affecting position: fixed scrollers (#4125)

## 2.0.6

### Patch Changes

- [#4108](https://github.com/lit/lit/pull/4108) [`eda56e4f`](https://github.com/lit/lit/commit/eda56e4f74463f1b1ef06045807417de6cb6356d) - Fix bug that prevented host from resizing when total item size changes.

## 2.0.5

### Patch Changes

- [#4039](https://github.com/lit/lit/pull/4039) [`456c83be`](https://github.com/lit/lit/commit/456c83be0438c2178a06144edd5deb8871613c36) Thanks [@alanbuzek](https://github.com/alanbuzek)! - Removed unnecessary evaluation triggering strict linter error.

- Updated dependencies [[`e2c50569`](https://github.com/lit/lit/commit/e2c50569c48849a9863e31dfd74a71bb4eb4524d), [`8057c78d`](https://github.com/lit/lit/commit/8057c78def09e345e68c3fc009b8ab9d6cf1c0f2)]:
  - lit@2.8.0

## 2.0.4

### Patch Changes

- [#3976](https://github.com/lit/lit/pull/3976) [`3cf98cd8`](https://github.com/lit/lit/commit/3cf98cd896e4d6a1aca9714916416d035a722140) Thanks [@Westbrook](https://github.com/Westbrook)! - Fixes #3904 "Clipping parents include ancestors of `position: fixed` element"

## 2.0.3

### Patch Changes

- [#3909](https://github.com/lit/lit/pull/3909) [`feded34b`](https://github.com/lit/lit/commit/feded34bf640291885b7d9de8713075cd7da1a54) Thanks [@chrispaterson](https://github.com/chrispaterson)! - Refactored and refurbished ScrollerController attach/detach code in effort to reduce potential memory leaks due to held instance references.

- [#3892](https://github.com/lit/lit/pull/3892) [`f5b2013d`](https://github.com/lit/lit/commit/f5b2013ddc38eb9b540e0b633a879ea860bc92d8) - Changed accessor and iterator code to support ES5 compilation.

- [#3929](https://github.com/lit/lit/pull/3929) [`c3672fca`](https://github.com/lit/lit/commit/c3672fca5ca6ed65156a2715fd1baf1d4430b0b1) - Added new support utilities for dealing with ResizeObserver loop limit exceeded errors.

## 2.0.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - lit@3.0.0-pre.0

## 2.0.2

### Patch Changes

- [#3877](https://github.com/lit/lit/pull/3877) [`4418bed5`](https://github.com/lit/lit/commit/4418bed55635c8340c335c3be32895899fa703f4) - Converted a benign innerHTML assignment to textContent.

- [#3884](https://github.com/lit/lit/pull/3884) [`2684dd65`](https://github.com/lit/lit/commit/2684dd6554a0ecb6ab2561b91488075fc9db9397) - Added license headers to files.

- [#3874](https://github.com/lit/lit/pull/3874) [`d32eec70`](https://github.com/lit/lit/commit/d32eec70c7eac08746dd4fb4378050b20bb724ba) - Fix [#3873: visibilityChange event not fired if other state (e.g. range) hasn't also changed](https://github.com/lit/lit/issues/3873)

## 2.0.1

### Patch Changes

- [#3819](https://github.com/lit/lit/pull/3819) [`f0c8336a`](https://github.com/lit/lit/commit/f0c8336a03ca2c02c48a13710eca8aca3ba70758) - Fix [#3815: Masonry: size and range bugs when the last item placed isn't the one extending the furthest](https://github.com/lit/lit/issues/3815)

- [#3708](https://github.com/lit/lit/pull/3708) [`a1f8c345`](https://github.com/lit/lit/commit/a1f8c345cc978be06c6416edd1228fc5471c53d8) - [@lit-labs/virtualizer]: handle uninitialized layout in \_childrenSizeChanged

## 2.0.0

### Major Changes

- [#3624](https://github.com/lit/lit/pull/3624) [`e51ff229`](https://github.com/lit/lit/commit/e51ff229843aaac22805bc0a39bf5e6db6862a5c) - ResizeObserver polyfill is no longer automatically loaded. If you target older browsers without native ResizeObserver support, see the docs for guidance on manual polyfill loading.

### Minor Changes

- [#3609](https://github.com/lit/lit/pull/3609) [`54046b0b`](https://github.com/lit/lit/commit/54046b0bbea4ff161567a92328700391efa35ff6) - RangeChangedEvent and VisibilityChangedEvent both no longer bubble up. Listeners for these events must be placed on the lit-virtualizer or virtualize directive's host element.

### Patch Changes

- [#3606](https://github.com/lit/lit/pull/3606) [`441baca2`](https://github.com/lit/lit/commit/441baca292f7e7df2c2a2a2453b027b3ade0a8bc) - Trigger reflow after padding is set

- [#3624](https://github.com/lit/lit/pull/3624) [`e51ff229`](https://github.com/lit/lit/commit/e51ff229843aaac22805bc0a39bf5e6db6862a5c) - Additional fix for [#3481: Error when immediately re-rendering](https://github.com/lit/lit/issues/3481); initialization code significantly simplified

- Updated dependencies [[`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f), [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544)]:
  - lit@2.7.0

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
