# 2020-09-20

## `lit` - 2.0.0

### Major Changes

- New package serving as the main entry point for all users of Lit (including `LitElement`, `ReactiveElement`, and `lit-html`). See the [Migration Guide](https://lit.dev/docs/releases/upgrade/#update-packages-and-import-paths) for more details.

## `lit-element` - 3.0.0

### Major Changes

- Most users should no longer import directly from `lit-element`, and instead prefer importing `LitElement` from the `lit` packages. The default entry point for `lit-element` remains backward-compatible and includes all decorators. However, it's recommended to use `import {LitElement} from 'lit';` and import decorators from `lit/decorators` as necessary. See the [Upgrade Guide](https://lit.dev/docs/releases/upgrade/#update-packages-and-import-paths) for more details.
- `UpdatingElement` has been moved from the `lit-element` package to the `@lit/reactive-element` package and renamed to `ReactiveElement`. See the [ReactiveElement API](https://lit.dev/docs/api/ReactiveElement/) documentation for more details. In addition, the source for `css-tag`, and all `decorators` have been moved to `@lit/reactive-element`. However, all symbols are re-exported from both `lit` and `lit-element` packages.
- The `@internalProperty` decorator has been renamed to `@state`.
- Errors that occur during the update cycle were previously squelched to allow subsequent updates to proceed normally. Now errors are re-fired asynchronously so they can be detected. Errors can be observed via an `unhandledrejection` event handler on window.
- The `lib` folder has been removed.
- Rendering of `renderRoot`/`shadowRoot`) via `createRenderRoot` and support for `static styles` has moved from `LitElement` to `ReactiveElement`.
- The `createRenderRoot` method is now called just before the first update rather than in the constructor. Element code can not assume the `renderRoot` exists before the element `hasUpdated`. This change was made for compatibility with SSR.
- `ReactiveElement`'s `initialize` method has been removed. This work is now done in the element constructor.
- The static `render` has been removed.
- For consistency, renamed `_getUpdateComplete` to `getUpdateComplete`.
- When a property declaration is `reflect: true` and its `toAttribute` function returns `undefined` the attribute is now removed where previously it was left unchanged ([#872](https://github.com/Polymer/lit-element/issues/872)).
- The dirty check in `attributeChangedCallback` has been removed. While technically breaking, in practice it should very rarely be ([#699](https://github.com/Polymer/lit-element/issues/699)).
- LitElement's `adoptStyles` method has been removed. Styling is now adopted in `createRenderRoot`. This method may be overridden to customize this behavior.
- LitElement's `static getStyles` method has been renamed to `static finalizeStyles` and now takes a list of styles the user provided and returns the styles which should be used in the element. If this method is overridden to integrate into a style management system, typically the `super` implementation should be called.
- Removed build support for TypeScript 3.4.
- Decorators are no longer exported from the `lit-element` module. Instead, import any decorators you use from `lit/decorators/*`.
- `lit-html` has been updated to 2.x.
- Support for running in older browsers has been removed from the default configuration. Import the `platform-support` module to support Shady DOM. Note also that Lit parts inside `<style>` elements are no longer supported. See [Polyfills](https://lit.dev/docs/tools/requirements/#polyfills) for more details.
- For simplicity, `requestUpdate` no longer returns a Promise. Instead await the `updateComplete` Promise.
- Removed `requestUpdateInternal`. The `requestUpdate` method is now identical to this method and should be used instead.
- [#2103](https://github.com/lit/lit/pull/2103) [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b) - Updates the `exports` field of `package.json` files to replace the [subpath
  folder
  mapping](https://nodejs.org/dist/latest-v16.x/docs/api/packages.html#packages_subpath_folder_mappings)
  syntax with an explicit list of all exported files.

  The `/`-suffixed syntax for subpath folder mapping originally used in these
  files is deprecated. Rather than update to the new syntax, this change replaces
  these mappings with individual entries for all exported files so that (a) users
  must import using extensions and (b) bundlers or other tools that don't resolve
  subpath folder mapping exactly as Node.js does won't break these packages'
  expectations around how they're imported.

### Minor Changes

- A public `renderOptions` class field now exists on `LitElement` and can be set/overridden to modify the options passed to `lit-html`.
- Adds `static shadowRootOptions` for customizing shadowRoot options. Rather than implementing `createRenderRoot`, this property can be set. For example, to create a closed shadowRoot using delegates focus: `static shadowRootOptions = {mode: 'closed', delegatesFocus: true}`.
- Adds development mode, which can be enabled by setting the `development` Node exports condition. See [Development and production builds](https://lit.dev/docs/tools/development/#development-and-production-builds) for more details.

### Patch Changes

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.
- For efficiency, the `css` function now maintains a cache and will use a cached value if available when the same style text is requested.
- Fixed reflecting a property when it is set in a setter of another property that is called because its attribute changed ([#965](https://github.com/Polymer/lit-element/issues/965)).
- Fixed exceptions when parsing attributes from JSON ([#722](https://github.com/Polymer/lit-element/issues/722)).
- Fixed issue with combining `static get properties` on an undefined superclass with `@property` on a subclass ([#890]https://github.com/Polymer/lit-element/issues/890));

## `@lit/reactive-element` - 1.0.0

### Major Changes

- `@lit/reactive-element` is a new package that factors out the base class that provides the reactive update lifecycle based on property/attribute changes to `LitElement` (what was previously called `UpdatingElement`) into a separate package. `LitElement` now extends `ReactiveElement` to add `lit-html` rendering via the `render()` callback. See [ReactiveElement API](https://lit.dev/docs/api/ReactiveElement/) for more details.
- `UpdatingElement` has been renamed to `ReactiveElement`.
- The `updating-element` package has been renamed to `@lit/reactive-element`.
- The `@internalProperty` decorator has been renamed to `@state`.
- For consistency, renamed `_getUpdateComplete` to `getUpdateComplete`.
- When a property declaration is `reflect: true` and its `toAttribute` function returns `undefined` the attribute is now removed where previously it was left unchanged ([#872](https://github.com/Polymer/lit-element/issues/872)).
- Errors that occur during the update cycle were previously squelched to allow subsequent updates to proceed normally. Now errors are re-fired asynchronously so they can be detected. Errors can be observed via an `unhandledrejection` event handler on window.
- ReactiveElement's `renderRoot` is now created when the element's `connectedCallback` is initially run.
- Removed `requestUpdateInternal`. The `requestUpdate` method is now identical to this method and should be used instead.
- The `initialize` method has been removed. This work is now done in the element constructor.

### Minor Changes

- Adds `static addInitializer` for adding a function which is called with the element instance when is created. This can be used, for example, to create decorators which hook into element lifecycle by creating a reactive controller ([#1663](https://github.com/Polymer/lit-html/issues/1663)).
- Added ability to add a controller to an element. A controller can implement callbacks that tie into element lifecycle, including `connectedCallback`, `disconnectedCallback`, `willUpdate`, `update`, and `updated`. To ensure it has access to the element lifecycle, a controller should be added in the element's constructor. To add a controller to the element, call `addController(controller)`.
- Added `removeController(controller)` which can be used to remove a controller from a `ReactiveElement`.
- Added `willUpdate(changedProperties)` lifecycle method to UpdatingElement. This is called before the `update` method and can be used to compute derived state needed for updating. This method is intended to be called during server side rendering and should not manipulate element DOM.

## `lit-html` - 2.0.0

### Major Changes

- The `templateFactory` option of `RenderOptions` has been removed.
- `TemplateProcessor` has been removed.
- Symbols are not converted to a string before mutating DOM, so passing a Symbol to an attribute or text binding will result in an exception.
- The `shady-render` module has been removed and is now part of `platform-support`, and Lit's polyfill support now adds the following limitations: (1) Bindings in style elements are no longer supported. Previously these could not change and in the future they may be supported via static bindings. (2) `ShadyCSS.styleElement` is no longer called automatically. This must be called whenever dynamic changes that affect styling are made that involve css custom property shimming (older browsers) or changes to custom properties used via the deprecated `@apply` feature. It was previously called only on first render, and it is now up to the user to decide when this should be called. See [Polyfills](https://lit.dev/docs/tools/requirements/#polyfills) for more details.
- `render()` no longer clears the container it's rendered to. It now appends to the container by default.
- Expressions in comments are no longer rendered or updated. See [Valid expression locations](https://lit.dev/docs/templates/expressions/#expression-locations) for more details.
- Template caching happens per callsite, not per template-tag/callsize pair. This means some rare forms of highly dynamic template tags are no longer supported.
- Arrays and other iterables passed to attribute bindings are not specially handled. Arrays will be rendered with their default toString representation. This means that `` html`<div class=${['a', 'b']}> `` will render `<div class="a,b">` instead of `<div class="a b">`. To get the old behavior, use `array.join(' ')`.
- Multiple bindings in a single attribute value don't require the attribute value is quoted, as long as there is no whitespace or other attribute-ending character in the attribute value. `` html`<div id=${a}-${b}>` ``
- The directive and part APIs are significantly different. See [Custom Directives](https://lit.dev/docs/templates/custom-directives/) and the [Upgrade Guide](https://lit.dev/docs/releases/upgrade/#update-custom-directive-implementations) for more details.
- The `Directive` base class and `directive()` factory function are
  now exported from the `lit-html/directive.js` module.
- `NodePart` has been renamed to `ChildPart`,
  along with other methods and variables that use the "Node" naming, like
  `PartType.Node` which is now `PartType.CHILD`.
- The part exports (`ChildPart`,
  `AttributePart`, etc) have been change to interface-only exports. The constructors are no longer exported. Directive authors should use helpers in `directive-helpers.js` to construct parts.
- The `eventContext` render option has been changed to `host`.
- [#2103](https://github.com/lit/lit/pull/2103) [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b) - Updates the `exports` field of `package.json` files to replace the [subpath
  folder
  mapping](https://nodejs.org/dist/latest-v16.x/docs/api/packages.html#packages_subpath_folder_mappings)
  syntax with an explicit list of all exported files.

  The `/`-suffixed syntax for subpath folder mapping originally used in these
  files is deprecated. Rather than update to the new syntax, this change replaces
  these mappings with individual entries for all exported files so that (a) users
  must import using extensions and (b) bundlers or other tools that don't resolve
  subpath folder mapping exactly as Node.js does won't break these packages'
  expectations around how they're imported.

- [#1764](https://github.com/lit/lit/pull/1764) [`0b4d6eda`](https://github.com/lit/lit/commit/0b4d6eda5220aeb53abe250217d70dcb8f45fe43) - Don't allow classMap to remove static classes. This keeps classMap consistent with building a string out of the classnames to be applied.

### Minor Changes

- Added `renderBefore` to render options. If specified, content is rendered before the node given via render options, e.g. `{renderBefore: node}`.
- Added development mode, which can be enabled by setting the `development` Node exports condition. See [Development and production builds](https://lit.dev/docs/tools/development/#development-and-production-builds) for more details.
- All usage of `instanceof` has been removed, making rendering more likely to
  work when multiple instances of the library interact.
- Template processing is more robust to expressions in places other than text and attribute values.
- `render` now returns the `ChildPart` that was created/updated by `render`.
- Added `AsyncDirective`, which is a `Directive` subclass whose
  `disconnected` callback will be called when the part containing the directive
  is cleared (or transitively cleared by a Part higher in the tree) or manually
  disconnected using the `setConnected` API, and whose `reconnected` callback
  will be called when manually re-connected using `setConnected`. When
  implementing `disconnected`, the `reconnected` callback should also be
  implemented to return the directive to a usable state. Note that `LitElement`
  will disconnect directives upon element disconnection, and re-connect
  directives upon element re-connection. See [Async directives](https://lit.dev/docs/templates/custom-directives/#async-directives) for more details.
- Added `setConnected(isConnected: boolean)` to `ChildPart`; when called with
  `false`, the `disconnected` callback will be run on any directives contained within
  the part (directly or transitively), but without clearing or causing a
  re-render to the tree. When called with `true`, any such directives'
  `reconnected` callback will be called prior to its next `update`/`render`
  callbacks. Note that `LitElement` will call this method by default on the
  rendered part in its `connectedCallback` and `disconnectedCallback`.
- Added the `static-html` module, a static `html` tag function, a `literal` tag function, and `unsafeStatic()`, which allows template authors to add strings to the
  static structure of the template, before it's parsed as HTML. See [Static expressions](https://lit.dev/docs/templates/expressions/#static-expressions) for more details.
- Added `lit-html/directive-helpers.js` module with helpers for creating custom directives. See [Custom directives](https://lit.dev/docs/api/custom-directives/#clearPart) for more details.
- Rendering `null`, `undefined`, or empty string in a `ChildPart` now has the same affect as rendering `nothing`: it does not produce an empty text node. When rendering into an element with Shadow DOM, this makes it harder to inadvertently prevent `<slot>` fallback content from rendering.
- Nested directives whose parent returns `noChange` are now unchanged. This
  allows the `guard` directive to guard directive values ([#1519](https://github.com/Polymer/lit-html/issues/1519)).
- Added optional `creationScope` to `RenderOptions`, which controls the node from which the template is cloned from.
- Added support for running with [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types) enforced.

### Patch Changes

- [#1922](https://github.com/lit/lit/pull/1922) [`8189f094`](https://github.com/lit/lit/commit/8189f09406a5ee2f2c7351884486944fd46e1d5b) - Binding `noChange` into an interpolated attribute expression now no longer removes the attribute on first render - instead it acts like an empty string. This is mostly noticable when using `until()` without a fallback in interpolated attributes.

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* [#2070](https://github.com/lit/lit/pull/2070) [`a48f39c8`](https://github.com/lit/lit/commit/a48f39c8d5872dbc9a19a9bc72b22692950071f5) - Throw instead of rendering an innocuous value into a style or script when security hooks are enabled.

* [#2044](https://github.com/lit/lit/pull/2044) [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0) - Improves disconnection handling for first-party `AsyncDirective`s (`until`, `asyncAppend`, `asyncReplace`) so that the directive (and any DOM associated with it) can be garbage collected before any promises they are awaiting resolve.
