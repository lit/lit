# @lit-labs/virtualizer

`@lit-labs/virtualizer` provides viewport-based virtualization (including virtual scrolling) for [Lit](https://lit.dev).

⚠️ `@lit-labs/virtualizer` is in late prerelease. Its API is intended to remain quite stable going forward, but you should expect (increasingly minor) changes before 1.0. Some of these changes may be technically breaking, but we anticipate that they will be mechanical and straightforward to make.

## Getting Started

Get this package:

```
npm i @lit-labs/virtualizer
```

Like Lit itself, the `@lit-labs/virtualizer` package is published as ES2021, using [ES modules](https://developers.google.com/web/fundamentals/primers/modules). The Lit packages use [bare specifiers](https://github.com/WICG/import-maps#bare-specifiers) to refer to their dependencies.

Shipping packages this way lets you control how whether and how they (along with your own source code) are bundled and transpiled for delivery to your users. However, it does require that you use a development server (or alternative tool chain) capable of _resolving_ bare specifiers on the fly, since browsers don't natively support them.

For more information and specific guidance, see the [Tools and Workflows docs](https://lit.dev/docs/tools/overview/) on [lit.dev](https://lit.dev).

## Documentation

### What is a virtualizer?

A virtualizer is an element that renders its own children, applying the provided `renderItem` template function to each item in the provided `items` array.

Instead of immediately rendering a child element for every item in the array, a virtualizer renders only enough elements to fill the viewport. As the viewport scrolls or resizes, the virtualizer automatically removes elements that are no longer visible and adds elements that have come into view.

**By default, a virtualizer is not itself a scroller**. Rather, it is a block-level element that sizes itself to take up enough space for all of its children, including those that aren't currently present in the DOM. It adds and removes child elements as needed whenever the window (or some other scrollable ancestor of the virtualizer) is scrolled or resized. It is possible, however, to [make a virtualizer into a scroller](#making-a-virtualizer-a-scroller).

### `<lit-virtualizer>` element

The most common way to make a virtualizer is to use the `<lit-virtualizer>` element. Here's how you would use `<lit-virtualizer>` inside a Lit element's `render` method:

```js
render() {
  return html`
    <h2>My Contacts</h2>
    <lit-virtualizer
      .items=${this.contacts}
      .renderItem=${contact => html`<div>${contact.name}: ${contact.phone}</div>`}
    ></lit-virtualizer>
  `;
}
```

Note: The examples throughout this documentation focus on the `<lit-virtualizer>` element, but the [`virtualize` directive](#virtualize-directive) provides an alternative that may be useful in certain cases.

### Making a virtualizer a scroller

If you want to make a virtualizer that is itself a scroller, just add the `scroller` attribute to the `<lit-virtualizer>` element, or add `scroller: true` to the options object for the [`virtualize` directive](#virtualize-directive):

```js
render() {
  return html`
    <lit-virtualizer
      scroller
      .items=${this.contacts}
      .renderItem=${contact => html`<div>${contact.name}: ${contact.phone}</div>`}
    ></lit-virtualizer>
  `;
}
```

When you make a virtualizer a scroller, you should explicitly size it to suit the needs of your layout. (By default, it has a `min-height` of 150 pixels to prevent it from collapsing to a zero-height block, but this default will rarely be what you want in practice.)

### Choosing a layout

`@lit-labs/virtualizer` currently supports two basic layouts, [`flow`](#flow-layout) (the default) and [`grid`](#grid-layout), which together cover a wide range of common use cases.

If you just want a vertical flow layout, then there's no need to do anything; that's what a virtualizer does out of the box. But if you want to select the `grid` layout instead, or if you want to set an option on the `flow` layout, then you'll use the virtualizer's `layout` property to do so. Here's an example:

```js
// First, import the layout you want to use. The reference returned
// is a function that takes an optional configuration object.
import {grid} from '@lit-labs/virtualizer/layouts/grid.js';
```

```js
// Inside your element's `render` function, use the imported function
// to set the virtualizer's `layout` property. In this case, we omit
// the configuration object so we'll get `grid`'s default options.
render() {
  return html`
    <lit-virtualizer
      .layout=${grid()}
      .items=${this.photos}
      .renderItem=${photo => html`<img src=${photo.url}>`}
    ></lit-virtualizer>
  `;
}
```

The layout system in `@lit-labs/virtualizer` is pluggable; custom layouts will eventually be supported via a formal layout authoring API. However, the layout authoring API is currently undocumented and less stable than other parts of the API. It is likely that official support of custom layouts will be a post-1.0 feature.

### Using the `flow` layout

By default, a virtualizer lays out its children using the `flow` layout, a simplified form of the browser's own default layout.

The `flow` layout's primary (and significant) simplification is that it expects all child elements to be styled as block-level elements and lays them out accordingly. Child elements will never be laid out "next to each other" inline, even if there were enough space to do so.

Child element size is determined "naturally"—that is, the size of each child element will depend on the data you provide in the `items` array, the nature of your `renderItem` template, and any CSS rules that apply to the child.

Internally, a virtualizer uses a native `ResizeObserver` to detect whenever child elements resize, and the `flow` layout automatically updates item positions as needed, behaving just like the browser's native flow layout in this respect.

#### Spacing child elements

To control the spacing of child elements, use standard CSS techniques to set margins on the elements.

Note that the `flow` layout offers limited support for [margin-collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing): margins set explicitly on child elements will be collapsed, but any margins on elements contained _within_ child elements are not considered.

#### Specifying layout direction

The `flow` layout works vertically by default. However, it also supports laying out child elements horizontally, via its `direction` property:

```js
  render() {
    return html`
      <lit-virtualizer
        .layout=${flow({
          direction: 'horizontal'
        })}
        .items=${this.photos}
        .renderItem=${photos => html`<img src=${photo.url}>`}
      ></lit-virtualizer>
    `;
  }

```

#### Using shorthand to specify `flow` options

Because `flow` is the default layout, you don't need to import it explicitly, even if you want to set options on it. Just pass an options object directly to your virtualizer's `layout` property, without wrapping it in the `flow()` function:

```js
// This shorthand form...
html`
  <lit-virtualizer
    .layout=${{
      direction: 'horizontal'
    }}
  ></lit-virtualizer>
`

// ...is equivalent to this:
html`
  <lit-virtualizer
    .layout=${flow(
      direction: 'horizontal'
    )}
  ></lit-virtualizer>
`
```

### Using the `grid` layout

TODO

### Scrolling

As much as possible, `@lit-labs/virtualizer` strives to "just work" with all of the native scrolling APIs (the `scrollTo()` method, the `scrollTop` and `scrollLeft` properties, and so on). When you need to scroll, just use native APIs directly on the `window`, on any scrolling element that happens to be an ancestor of your virtualizer in the DOM tree, or on your virtualizer itself (if it [is a scroller](#making-a-virtualizer-a-scroller)).

Besides the native scrolling APIs, there are a couple of virtualizer-specific APIs that you may find useful in certain circumstances: a method for scrolling "virtual" child elements into view, and a declarative way to frame a given child element within the viewport. These APIs are described in the sections below.

Finally, there one quirk to be aware of when smoothly scrolling a view containing a virtualizer.

#### Scrolling a child element into view

If you want to scroll one of a virtualizer's children into view _and that element is currently present in the DOM_ because it is within the viewport or just outside, you can use the native web API: get a reference to the element, and then call `myElement.scrollIntoView()` with whatever options you desire.

However, this method won't work if the child element you want to scroll into view is currently "virtualized" (i.e., is not currently present in the DOM because it is too far outside the viewport). For this reason, a virtualizer exposes the `element()` method, which takes a numeric index (specifying an item in the `items` array) and returns a simple proxy object representing the corresponding child element (whether the element is present in the DOM or not). This proxy currently exposes just one method: `scrollIntoView()`, which matches the behavior of the native method. Here's an example:

```js
// Get a reference to the virtualizer, using any method
const virtualizer = this.shadowRoot.querySelector('<lit-virtualizer>');

// Then use the `element()` method to get a proxy and call `scrollIntoView()`
virtualizer.element(42).scrollIntoView({
  block: 'center',
  behavior: 'smooth',
});
```

Note:

- The proxy's `scrollIntoView()` method supports same options as the native API, but the `inline` option has no effect at present, because all currently available layouts virtualize along a single axis and keep child elements within view along the secondary axis at all times.
- If you're using the `virtualize` directive, getting a reference to the virtualizer so you can call `element()` requires one extra step—see [Getting a reference to the virtualizer](#getting-a-reference-to-the-virtualizer).

#### Framing a child element within the viewport

Whereas `scrollIntoView()` lets you imperatively scroll a given child element into view, the `pin` property on a virtualizer layout provides a declarative way to frame an element within the viewport. This is especially useful if you want a specific element to be in view when you initially render a virtualizer. Here's an example:

```js
render() {
  // In this toy example, we pin the layout to a hard-coded position. In
  // reality, you'll almost always want to maintain some state of your
  // own to keep track of whether the layout should be pinned, and to
  // which child element. See the note below about the `unpinned` event.
  return html`
    <h2>My Contacts</h2>
    <lit-virtualizer
      .items=${this.contacts}
      .renderItem=${contact => html`<div>${contact.name}: ${contact.phone}</div>`}
      .layout=${{
        pin: {
          index: 42,
          block: 'start'
        }
      }}
    ></lit-virtualizer>
  `;
}
```

The `pin` property takes an option called `index` to specify (by number) which child element you want to frame in the viewport. If you want, you can also use the `block` option to indicate how the element should be framed relative to the viewport; `block` behaves identically to the same option in the `scrollIntoView()` method.

When you pin a layout, it remains pinned until the user intentionally scrolls the view, at which point it is automatically "unpinned". When this occurs, the virtualizer fires an `unpinned` event. Unless you're sure you'll only render your virtualizer once, you should listen for the `unpinned` event so you can omit the `pin` property when you re-render the virtualizer and avoid snapping the view back to the previously pinned position. [TODO: link to an example]

#### A note on smooth scrolling

As noted above, `@lit-labs/virtualizer` essentially "just works" with the browser's native scrolling APIs, including smooth scrolling (as specified via the `behavior: 'smooth'` option).

That said, depending on what layout you're using and what browser you're scrolling in, you may sometimes notice a slight "hitch" in the scrolling animation, where it momentarily slows—usually shortly before reaching its destination.

This only occurs with the `flow` layout and is noticeable mainly (perhaps only) in Chromium-based browsers. It happens when the layout has been estimating the sizes of child elements it hasn't yet measured and needs to correct errors in its estimates while a smooth scrolling animation is in progress.

This is a known limitation which, unless smooth scrolling in Chromium evolves to behave more like other browsers, probably can't be addressed without changing `@lit-labs/virtualizer` to use JavaScript-based scrolling in place of native scrolling.

### `virtualize` directive

An alternative way to use `@lit-labs/virtualizer` is via the `virtualize` directive; this directive turns its parent element into a virtualizer.

The `virtualize` directive is useful primarily if your project utilizes Lit templates but not the `LitElement` base class and you want to keep your imports to a minimum.

It can also be useful in cases like the one below, where we want to virtualize an unordered list (`<ul>`) element and don't want or need a separate container for its `<li>` children:

```js
render() {
  return html`
    <ul>
      ${virtualize({
        items: this.contacts,
        renderItem: contact => html`<li>${contact.name}</li>`
      })}
    </ul>
  `;
}
```

The capabilities of the `virtualizer` directive are the same as those of the `<lit-virtualizer>` element. The configuration APIs are the same as well, except that features expressed as properties and attributes on the `<lit-virtualizer>` element are instead expressed as properties in an options object passed as the single argument to the `virtualize` directive.

### Getting a reference to the virtualizer

In addition to its declarative configuration options, a virtualizer exposes a handful of imperative APIs. The `<lit-virtualizer>` element exposes these APIs directly, but to use them with the `virtualize` directive you need to get a reference to the virtualizer. You do this by first getting a reference to the virtualizer's host element (the element within which you rendered the directive) and then using the `virtualizerRef` symbol to get a reference to the virtualizer itself. For example:

```ts
import {html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
// Import the `virtualizerRef` symbol along with the directive
import {virtualize, virtualizerRef} from '@lit-labs/virtualizer/virtualize.js';

@customElement('my-items')
export class MyItems extends LitElement {
  data = new Array(100).fill('').map((i, n) => ({text: `Item ${n}`}));

  @query('ul')
  list: HTMLUListElement;

  render() {
    return html`
      <ul>
        ${virtualize({
          items: this.data,
          renderItem: (i) => html`<li>${i.text}</li>`,
        })}
      </ul>
    `;
  }

  scrollToListItem(idx) {
    // Use the `virtualizerRef` symbol as a property key on the
    // host element to access the virtualizer reference
    this.list[virtualizerRef].element(idx).scrollIntoView();
  }
}
```

## ResizeObserver dependency

Virtualizer depends on the standard [`ResizeObserver`]() API, which is supported in all modern browsers. In case your browser support matrix includes older browsers that don't implement `ResizeObserver`, the Virtualizer package includes a `ResizeObserver` polyfill that is known to be compatible with Virtualizer. This is a forked version of Denis Rul's `resize-observer-polyfill` package, which we modified to extend its observations into shadow roots.

### Using the default loader

The package also includes a simple mechanism for loading the `ResizeObserver` polyfill. This mechanism uses feature detection to determine whether the polyfill is required; if it is, then the polyfill is automatically loaded and provided directly to Virtualizer.

You need to invoke the loader—which is asynchronous—and await its return before running any code that would cause a virtualizer to be instantiated. The simplest way to do this is to load virtualizer itself with a dynamic `import()` statement. For example:

```js
import {loadPolyfillIfNeeded} from '@lit-labs/virtualizer/polyfillLoaders/ResizeObserver.js';

async function load() {
  await loadPolyfillIfNeeded();
  await import('@lit-labs/virtualizer');
}
```

### Writing a custom loader

In case you want to make the `ResizeObserver` polyfill available for use outside of Virtualizer or have other specialized polyfill-loading requirements, you can alternatively import the polyfill directly and write your own custom code for loading and exposing it.

If you choose this option, there are two ways you can make the polyfill available for Virtualizer to use:

- Expose the polyfill via `window.ResizeObserver` so that Virtualizer can access it just as it would the native implementation.
- Pass the polyfill constructor to Virtualizer's `provideResizeObserver()` function.

Either way, you should do so before instantiating any virtualizers, just as when you use the provided loader.

Here's how you would import the polyfill and the `provideResizeObserver()` function statically:

```js
import ResizeObserverPolyfill from '@lit-labs/virtualizer/polyfills/resize-observer-polyfill/ResizeObserver.js';
import {provideResizeObserver} from '@lit-labs/virtualizer/polyfillLoaders/ResizeObserver.js';
```

More typically, though, you'd import them dynamically:

```js
async function myCustomLoader() {
  // Write whatever custom logic you need, using feature detection, etc...

  // If you need to load the polyfill, do it like this:
  const ResizeObserverPolyfill = await import(
    '@lit-labs/virtualizer/polyfills/resize-observer-polyfill/ResizeObserver.js'
  ).default;

  // To install the polyfill globally, do something like this:
  window.ResizeObserver = ResizeObserverPolyfill;

  // Or to provide it to Virtualizer, do something like this:
  const {provideResizeObserver} = await import(
    '@lit-labs/virtualizer/polyfillLoaders/ResizeObserver.js'
  );
  provideResizeObserver(ResizeObserverPolyfill);
}
```

### "ResizeObserver loop limit exceeded" errors

When using Virtualizer, you may see this error in your console and depending on your testing framework, it may be causing your tests to fail. The error itself is benign and only means that the ResizeObserver was not able to deliver all observations within a single animation frame. It may be safely ignored, but it may be necessary to instruct your framework to ignore it as well to prevent unnecessary side-effects and error-handling.

To assist with this, a few functions are provided in the support folder. These functions are independent of each other and you will need to choose which best fits to your situation.

#### window.onerror patches

Testing frameworks like Mocha define an `onerror` handler directly on `window` which catch any unhandled exceptions and report them as failures. The following two solutions wrap this handler to ignore the loop limit errors specifically.

#### setupIgnoreWindowResizeObserverLoopErrors()

The simplest approach is to use this function to wrap and unwrap the onerror handler before and after each test. With a Mocha setup you would use it like this:

```ts
import {setupIgnoreWindowResizeObserverLoopErrors} from '@lit-labs/virtualizer/support/resize-observer-errors.js';

describe('My virtualized collection', () => {
  setupIgnoreWindowResizeObserverLoopErrors(beforeEach, afterEach);

  it('does this and that', () => {
    /* test stuff */
  });
});
```

By handing `setupIgnoreWindowResizeObserverLoopErrors` the `beforeEach` and `afterEach` callbacks, it is able to define the appropriate setup and teardown for you. The only case where this may not work is if you are for some reason patching `window.onerror` as well; if the teardown step does not see the expected handler in place before restoring the original handler it will throw and error to alert you to an "out-of-sequence interceptor teardown." In the rare case you have competing patches of `window.onerror` you can use the next option, `ignoreWindowResizeObserverLoopErrors`.

#### ignoreWindowResizeObserverLoopErrors()

This method allows you to be specific about the timing/ordering that the `window.onerror` patch is removed, which may be necessary if you have more complicated setups and/or multiple patches to `window.onerror`. `ignoreWindowResizeObserverLoopErrors` returns a function that restores `onerror` to its original form prior to the patch. Notice that multiple patches generally need to removed in reverse order.

```ts
import {ignoreWindowResizeObserverLoopErrors} from '@lit-labs/virtualizer/support/resize-observer-errors.js';

describe('My virtualized collection', () => {
  let teardown;

  beforeEach(() => (teardown = ignoreWindowResizeObserverLoopErrors()));
  beforeEach(() => applyOtherWindowOnErrorPatch());

  afterEach(() => removeOtherWindowOnErrorPatch());
  afterEach(() => teardown());

  it('does this and that', () => {
    // etc
  });
});
```

#### preventResizeObserverLoopErrorEventDefaults()

If an explicit `window.onerror` handler function has not been defined, you may be able to swallow up the loop limit errors with an event listener. This function adds that event listener to window and attempts to ignore and prevent any further event propogation or behaviors as a result.

```ts
import {preventResizeObserverLoopErrorEventDefaults} from '@lit-labs/virtualizer/support/resize-observer-errors.js';

preventResizeObserverLoopErrorEventDefaults();
```

If you need to remove the event listener that this function adds at some point, you can assign the return of the function, which is a function that removes the listener, to a variable for later use:

```ts
const teardown = preventResizeObserverLoopErrorEventDefaults();

/* some time later... */
teardown();
```

Note that for this to be effective, you'll need to call it to add the event listener to window as early as you can, to ensure it is in place prior to any other event listeners who would otherwise receive the event first.

## API Reference

### `items` property

Type: `Array<T>`

An array of items (JavaScript values, typically objects) representing the child elements of the virtualizer.

The types of values you use to represent your items are entirely up to you, as long as your `renderItem` function can transform each value into a child element.

### `renderItem` property

Type: `(item: T, index?: number) => TemplateResult`

A function that returns a Lit `TemplateResult`. It will be used to generate a child element for each item in the `items` array.

### `scroller` attribute / property

Type: `Boolean`

Optional. If this attribute is present (or, in the case of the `virtualize` directive, if this property has a truthy value), then the virtualizer itself will be a scroller. Otherwise, the virtualizer will not scroll but will size itself to take up enough space for all of its children, including those that aren't currently present in the DOM.

### `scrollToIndex` method

Type: `(index: number, position?: string) => void`

where position is: `'start'|'center'|'end'|'nearest'`

Scroll to the item at the given index. Place the item at the given position within the viewport. For example, if index is `100` and position is `end`, then the bottom of the item at index 100 will be at the bottom of the viewport. Position defaults to `start`.

_Note: Details of the `scrollToIndex` API are likely to change before the 1.0 release, but changes required to your existing code should be minimal and mechanical in nature._

Example usage:

```js
// Where `myVirtualizer` is a reference to a <lit-virtualizer> instance, this
// will scroll to the 100th item and put it in the center of the viewport.
myVirtualizer.scrollToIndex(100, 'center');
```

### `visibilityChanged` event

Fired whenever a change to the viewport (due to scrolling or resizing) affects the set of virtualizer child elements that are currently visible. The `first` property represents the index of the first visible element; the `last` property represents the index of the last visible element.

### `rangeChanged` event

Fired whenever a virtualizer adds child elements to the DOM, or removes child elements from the DOM. The `first` property represents the index of the first element currently present in the DOM; the `last` property represents the index of the last element currently present in the DOM.

Note that a virtualizer maintains a "buffer" of elements that are in the DOM but just outside the viewport, so the set of elements in the DOM will be somewhat larger than the set of visible elements.
