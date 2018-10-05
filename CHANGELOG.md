# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## Unreleased -->
<!-- ### Added -->
<!-- ### Changed -->
<!-- ### Removed -->
<!-- ### Fixed -->

## [0.12.0] - 2018-10-05
### Changed
* Re-implemented repeat directive for better performance ([#501](https://github.com/Polymer/lit-html/pull/501))
* Updated TypeScript dependency to 3.1
* [Breaking] `render()` now takes an options object as the third argument. ([#523](https://github.com/Polymer/lit-html/pull/523))
### Added
* Event listeners are called with a configurable `this` reference, which is set via the `eventContext` option to `render()`. ([#523](https://github.com/Polymer/lit-html/pull/523))
* Support for event listener options, by passing the listener itself as both the second and third arguments to add/removeEventListener().

<!-- ### Removed -->
<!-- ### Fixed -->

## [0.11.4] - 2018-09-17
### Fixed
* Fixed issues with `shady-render` introduced in 0.11.3 ([#504](https://github.com/Polymer/lit-html/issues/504) and [#505](https://github.com/Polymer/lit-html/issues/505)).

## [0.11.3] - 2018-09-13
### Changed
* Moved upgrading of custom elements in template fragments to a common location in TemplateInstance ([#489](https://github.com/Polymer/lit-html/pull/489))
* Rewrite render() to reuse the logic in NodePart. render() now supports all the data types that NodeParts do. ([#491](https://github.com/Polymer/lit-html/pull/491))

### Fixed
* Fixed bug when using the ShadyCSS @apply` shim. ([#502](https://github.com/Polymer/lit-html/pull/502))

## [0.11.2] - 2018-09-12

### Added
* Added `classMap` and `styleMap` directives ([#486](https://github.com/Polymer/lit-html/pull/486))

### Fixed

* Fixed bug in asyncReplace when rerendering the same iterable ([#485](https://github.com/Polymer/lit-html/pull/485))
* Update properties before upgrading custom elements ([#455](https://github.com/Polymer/lit-html/pull/455))
* Cache the ShadyCSS version lookup ([#477](https://github.com/Polymer/lit-html/pull/477))

## [0.11.1] - 2018-09-02

### Changed
* Eliminated a cycle in the module import graph ([#472](https://github.com/Polymer/lit-html/pull/472))
* Remove the default value for the templateProcessor parameter in TemplateResult#constuctor, making it a required paremeter ([#472](https://github.com/Polymer/lit-html/pull/472))

## [0.11.0] - 2018-08-28

### Added
* Added support for property, event, and boolean bindings to default syntax ([#398](https://github.com/Polymer/lit-html/pull/398))
* Added guard directive ([#438](https://github.com/Polymer/lit-html/pull/438))
* Added when directive ([#439](https://github.com/Polymer/lit-html/pull/439))

### Changed
* Split implementation into multiple small modules and merged lit-html.js and core.js ([#436](https://github.com/Polymer/lit-html/pull/436))
* Moved directives into top-level `directives/` directory ([#436](https://github.com/Polymer/lit-html/pull/436))
* Replaced `PartCallback` with `TemplateProcessor` ([#405](https://github.com/Polymer/lit-html/pull/405))
* Unified `NodePart` and `AttributePart` interfaces ([#400](https://github.com/Polymer/lit-html/pull/400))
  * AttributePart#setValue() takes a single value
  * `Part` has separate `setValue()` and `commit()` phases
  * Added `AttributeCommitter` to commit attribute values once for multiple `AttributeParts`

### Removed
* Removed lit-extended.js ([#436](https://github.com/Polymer/lit-html/pull/436))

### Fixed
* Render initial undefined values in attributes ([#377](https://github.com/Polymer/lit-html/pull/377))
* Handle case-sensitive attributes like `viewBox` correctly ([#376](https://github.com/Polymer/lit-html/pull/376))
* Support bindings in `<template>` elements ([#343](https://github.com/Polymer/lit-html/pull/343))
* Don’t break templates when HTML comments have bindings in them ([#446](https://github.com/Polymer/lit-html/pull/446))
* IE: Don't use Set() constructor arguments ([#401](https://github.com/Polymer/lit-html/pull/401))
* Handle forms as Node instead of iterable ([#404](https://github.com/Polymer/lit-html/pull/404))
* Update values after upgrading custom elements ([#385](https://github.com/Polymer/lit-html/pull/385))
* Dirty check primitive values passed to unsafeHTML() ([#384](https://github.com/Polymer/lit-html/pull/384))
* Handle forms as Node instead of iterable ([#404](https://github.com/Polymer/lit-html/pull/404))
* Upgrade disconnected custom elements before setting properties on them. ([#442](https://github.com/Polymer/lit-html/pull/442))
* Fix style attribute bindings in IE ([#448](https://github.com/Polymer/lit-html/pull/448))


## [0.10.1] - 2018-06-13

* Added `noChange` - Value in favour of `directiveValue` (deprecated).
  * A `noChange` - Value signals that a value was handled by a directive and should not be written to the DOM
* Updated shady-render to render styles in order, work with `@apply`, and work in browers where CSS Custom Properties must be polyfilled, like IE 11.
* Introduced API to modify template contents safely without breaking template parts
  * `insertNodeIntoTemplate(template: Template, node: Node, refNode: Node|null)`
  * `removeNodesFromTemplate(template: Template, nodesToRemove: Set<Node>)`

## [0.10.0] - 2018-05-03
* Added IE11 support
* Declarative events in lit-extended are more efficient when handlers change

## [0.9.0] - 2018-02-01

* Refactored how template tags and `render()` are implemented so that all
  specialization of template syntax is done in tags, not `render()`, allowing
  for the mixining of templates of different syntaxes, and for hooks in
  `render()` to change templates before they're initially processed.
* Added ShadyCSS support in lib/shady-render.js. It's exported render function
  will pass templates to ShadyCSS's `prepareTemplate()` function to process style
  tags and elements in the template for emulate CSS scoping.
* lit-extended: Attribute bindings with a `?` suffix on the name now act as boolean
  attributes. The attribute will be removed for falsey values and set to `''` for
  truthy values, matching the HTML specification behavior for boolean attributes.
* Fixed a bug where directives rendered incorrectly on AttributeParts and PropertyParts

## [0.8.0] - 2018-01-12

* Allow all valid HTML attribute names, including emoji and Angular-style
  `(foo)=` and `[foo]=` names.
* Drastically improved performance of the `repeat` directive.
* Fixed an issue with expressions directly following elements.
* Fixed numerous bugs with the `repeat` directive.
* Performance improvements for template setup
* Internal code cleanup
* Support synchronous thenables
* Added the `asyncAppend` and `asyncReplace` directives to handle async iterable values in expressions.

## [0.7.0] - 2017-10-06

* Added the `svg` template tag for creating partial SVG content
* Support for expressions inside tables and other elements with limited permitted content
* Only remove whitespace between elements, or at the start or end of elements
* Fixed bugs with rendering iterables
* A few IE/Edge fixes. Closer to full support.

## [0.6.0] - 2017-09-01

* Fixed removing event handlers when setting them to `undefined`.
* Allow the text "{{}}" to appear in templates.
* Optimized clearing of Parts.
* Added `unsafeHTML()` directive to bind values as HTML source.
* Optimizations, simplification and bug fixes of Array handling code.
* Update to extension API: added partCallback parameter to `render()`.
* Added the `directive()` decorator function to create directives. Functions values are no longer treated as directive by default, simplifying declarative event handlers.
