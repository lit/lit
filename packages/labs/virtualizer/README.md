# @lit-labs/virtualizer

`@lit-labs/virtualizer` provides viewport-based virtualization (including virtual scrolling) for [Lit](https://lit.dev).

[![Build Status](https://github.com/lit/lit/workflows/Tests/badge.svg)](https://github.com/lit/lit/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/@lit-labs/virtualizer.svg?logo=npm)](https://www.npmjs.com/package/@lit-labs/virtualizer)
[![Join our Discord](https://img.shields.io/badge/discord-join%20chat-5865F2.svg?logo=discord&logoColor=fff)](https://lit.dev/discord/)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/). It
> is published in order to get feedback on the design and may receive breaking
> changes or stop being supported.
>
> Please read our [Lit Labs documentation](https://lit.dev/docs/libraries/labs/)
> before using this library in production.
>
> Give feedback: https://github.com/lit/lit/discussions/3362

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

When you make a virtualizer a scroller, you should explicitly size it to suit the needs of your layout. If you don't, the virtualizer will have zero size in one or both dimensions, so won't render any children. If you forget to size a scrolling virtualizer, a console warning will appear to help you diagnose the issue.

> [!NOTE]
> Earlier versions of `@lit-labs/virtualizer` set a `min-height` of `150px` on scrolling virtualizers to avoid this zero-size case, but this approach was heavy-handed and doesn't play nicely with [CSS writing mode and direction](#writing-mode-and-direction), so has been replaced with the console warning.

### Writing mode and direction

The virtualizer is aware of CSS `writing-mode` and `direction` and should generally "just work" if you want virtualization along the block axis (e.g., the vertical axis in the browser's default `horizontal-tb` writing mode):

- All CSS writing modes are supported: `horizontal-tb` (the default), `vertical-lr`, and `vertical-rl`
- When laying out child elements, the virtualizer will respect the CSS direction (`ltr` or `rtl`)

> [!NOTE]
> If you want to use the default window scroller with a virtualizer in the `vertical-rl` writing mode, be sure to set `writing-mode: vertical-rl` on the `<html>` element. If you set the writing mode on a descendant element instead, the document's scroll model remains `horizontal-tb` and you won't be able to scroll from right to left to see the virtualized content.

### Virtualizing on the inline axis

If you want to virtualize along the inline axis instead—for example, to render a horizontal "shelf" or a carousel in the default writing mode—use the `axis` property:

```js
render() {
  return html`
    <lit-virtualizer
      scroller
      axis="inline"
      .items=${this.photos}
      .renderItem=${photo => html`<img src=${photo.url}>`}
    ></lit-virtualizer>
  `;
}
```

> [!NOTE]
> Under the hood, `axis="inline"` works by "flipping" the virtualizer's own `writing-mode` to the opposite of its CSS context and restoring the original writing mode on each child element. If you have specialized needs, you can manipulate these writing modes directly via CSS instead of using the `axis` property.

> [!NOTE]
> The `direction` layout config option (e.g., `.layout=${{direction: 'horizontal'}}`) supported in earlier versions of `@lit-labs/virtualizer` is deprecated and will be removed in a future version, but still works for now. To migrate, remove `direction` from your layout config and use `axis="inline"` or explicit CSS instead.

### Choosing a layout

`@lit-labs/virtualizer` currently supports two basic layouts, [`flow`](#flow-layout) (the default) and [`grid`](#grid-layout), which together cover a wide range of common use cases.

If you just want a vertical flow layout, there's no need to do anything; that's what a virtualizer does out of the box. But if you want to use the `grid` layout, you'll set the virtualizer's `layout` property. Here's an example:

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

The layout system in `@lit-labs/virtualizer` is pluggable; custom layouts will eventually be supported via a formal layout authoring API. However, the layout authoring API is currently undocumented and less stable than other parts of the API. Official support of custom layouts is planned for a future version.

### Using the `flow` layout

By default, a virtualizer lays out its children using the `flow` layout, a simplified form of the browser's own default layout.

The `flow` layout's primary (and significant) simplification is that it expects all child elements to be styled as block-level elements and lays them out accordingly. Child elements will never be laid out "next to each other" inline, even if there were enough space to do so.

Child element size is determined "naturally"—that is, the size of each child element will depend on the data you provide in the `items` array, the nature of your `renderItem` template, and any CSS rules that apply to the child.

Internally, a virtualizer uses a native `ResizeObserver` to detect whenever child elements resize, and the `flow` layout automatically updates item positions as needed, behaving just like the browser's native flow layout in this respect.

#### Spacing child elements

To control the spacing of child elements, use standard CSS techniques to set margins on the elements.

Note that the `flow` layout offers limited support for [margin-collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing): margins set explicitly on child elements will be collapsed, but any margins on elements contained _within_ child elements are not considered.

### Using the `grid` layout

The `grid` layout arranges child elements in a grid with uniform cell sizes. Unlike the `flow` layout, which determines child element sizes naturally from their content, `grid` uses a specified item size and calculates how many columns fit in the available space.

```js
import {grid} from '@lit-labs/virtualizer/layouts/grid.js';
```

Like the virtualizer itself, the grid layout respects CSS `writing-mode` and `direction`. In the default `horizontal-tb` writing mode, the grid fills columns across the inline axis (horizontally) and rows along the block axis (vertically, which is the scrolling direction). In vertical writing modes, these axes swap: columns run vertically and rows run horizontally. The CSS `direction` property (`ltr` or `rtl`) determines the order in which columns are filled.

#### Grid layout options

##### `itemSize`

The ideal size of each grid item. Accepts a single value (applied to both dimensions) or an object with explicit dimensions.

Default: `{width: '300px', height: '300px'}`

```js
// Single value (both dimensions)
grid({itemSize: '100px'});

// Explicit physical dimensions
grid({itemSize: {width: '200px', height: '150px'}});

// Logical dimensions (relative to the writing mode)
grid({itemSize: {inlineSize: '200px', blockSize: '150px'}});
```

When you use `width` and `height`, these dimensions will be applied to the width and height of child elements regardless of the current CSS `writing-mode`. In contrast, when you provide dimensions in terms of `inlineSize` / `blockSize`, the current writing mode determines how these values map to the elements' width and height.

##### `gap`

Spacing between grid items. Accepts a single value (applied to both axes) or two values (block axis, then inline axis).

Default: `'8px'`

```js
// Uniform gap
grid({gap: '12px'});

// Different block and inline gaps
grid({gap: '8px 16px'});
```

The block-axis gap value can be set to `'auto'`, but only when `justify` is set to `'space-between'`, `'space-around'`, or `'space-evenly'`. In this case, the block-axis gap is automatically calculated to match the inline-axis spacing.

##### `padding`

Spacing around the edges of the grid. Uses CSS-like shorthand (1 to 4 values).

Default: `'match-gap'`

The special value `'match-gap'` sets padding equal to the gap value, giving uniform spacing around and between items. You can also use `'match-gap'` as an individual value in multi-value shorthand (e.g., `'match-gap 16px'`).

##### `flex`

Controls whether items resize to fill the available width. When enabled, the grid calculates how many columns fit and then stretches items to eliminate leftover space.

Default: `false`

- `false` — items maintain exact `itemSize` dimensions
- `true` — items resize to fill the row, preserving area (equivalent to `{preserve: 'area'}`)
- `{preserve: 'aspect-ratio'}` — items resize while maintaining their original aspect ratio
- `{preserve: 'area'}` — items resize while maintaining their original area
- `{preserve: 'width'}` or `{preserve: 'height'}` — items resize while keeping the specified dimension fixed

##### `justify`

Controls horizontal alignment of columns within the grid.

Default: `'start'`

Values: `'start'`, `'center'`, `'end'`, `'space-evenly'`, `'space-around'`, `'space-between'`

The space-distribution values (`'space-evenly'`, `'space-around'`, `'space-between'`) automatically calculate spacing between columns, overriding inline-axis gap and padding.

##### How `flex` and `justify` interact

The `flex` and `justify` options are independent but interact. `flex` controls whether items resize to fill the available inline space, while `justify` controls how columns are positioned within that space.

When `flex` is enabled, items stretch to fill each row completely, so there is no leftover space for `justify` to distribute. In this case, the space-distribution values (`'space-between'`, `'space-around'`, `'space-evenly'`) have no effect; spacing is controlled entirely by the explicit `gap` and `padding` values. The alignment values (`'start'`, `'center'`, `'end'`) still apply when flex is on.

When `flex` is disabled and a space-distribution `justify` value is used, the layout automatically calculates spacing between columns, overriding the configured inline-axis `gap` and `padding`.

#### Grid layout examples

A basic grid with custom item sizes:

```js
render() {
  return html`
    <lit-virtualizer
      .layout=${grid({itemSize: {width: '200px', height: '150px'}})}
      .items=${this.photos}
      .renderItem=${photo => html`<img src=${photo.url}>`}
    ></lit-virtualizer>
  `;
}
```

A responsive grid where items resize to fill each row, preserving their area:

```js
render() {
  return html`
    <lit-virtualizer
      .layout=${grid({itemSize: '250px', flex: true})}
      .items=${this.photos}
      .renderItem=${photo => html`<img src=${photo.url}>`}
    ></lit-virtualizer>
  `;
}
```

A grid with evenly distributed spacing:

```js
render() {
  return html`
    <lit-virtualizer
      .layout=${grid({
        itemSize: '200px',
        justify: 'space-evenly',
        gap: 'auto 12px'
      })}
      .items=${this.photos}
      .renderItem=${photo => html`<img src=${photo.url}>`}
    ></lit-virtualizer>
  `;
}
```

### Using the `masonry` layout

The `masonry` layout arranges child elements in uniformly sized columns along the inline axis, with each item's size along the block axis (the scrolling direction) determined by its aspect ratio. Unlike the `grid` layout, where every item has the same size, masonry items can vary in one dimension — which makes it a natural fit for collections of photos, videos, and other content with different intrinsic proportions that you want to tile without leaving gaps.

```js
import {masonry} from '@lit-labs/virtualizer/layouts/masonry.js';
```

Like the virtualizer itself and the `grid` layout, the masonry layout respects CSS `writing-mode` and `direction`; see the [grid layout](#using-the-grid-layout) section above for details on how the logical-axis semantics map to visual axes.

#### Masonry layout options

The `gap`, `padding`, `flex`, and `justify` options are inherited from the `grid` layout and behave the same way — see [Grid layout options](#grid-layout-options). The two options unique to masonry are `itemSize` and `getAspectRatio`.

##### `itemSize`

The size of each column along the inline axis. Unlike `grid`'s `itemSize`, masonry takes a single pixel value (not a pair) because items size themselves along the block axis from their aspect ratio rather than from an explicit dimension.

Default: `'300px'`

```js
masonry({itemSize: '200px'});
```

##### `getAspectRatio`

A function that returns a per-item aspect ratio, interpreted as **visual `width / height`**. The layout preserves this visual ratio across all writing-mode and `axis` configurations: e.g., a caller returning `2` for a 2:1 landscape photo sees that photo rendered visually twice as wide as it is tall, whether the virtualizer scrolls along the block or inline axis and whether the writing-mode is `horizontal-tb`, `vertical-lr`, or `vertical-rl`.

```js
masonry({
  itemSize: '200px',
  getAspectRatio: (photo) => photo.width / photo.height,
});
```

If omitted, items are treated as square (aspect ratio `1`).

> [!NOTE]
> This semantic is the right fit for images, videos, and other content whose dimensions are intrinsic and writing-mode-independent. It is not appropriate for flow-like content (e.g. text cards) whose shape depends on the writing-mode. A logical (`inlineSize / blockSize`) aspect-ratio variant is planned — see [#5308](https://github.com/lit/lit/issues/5308).

#### Masonry layout example

A photo shelf where each item knows its intrinsic dimensions:

```js
render() {
  return html`
    <lit-virtualizer
      .layout=${masonry({
        itemSize: '250px',
        gap: '8px',
        getAspectRatio: (photo) => photo.width / photo.height,
      })}
      .items=${this.photos}
      .renderItem=${(photo) => html`
        <img src=${photo.url} alt=${photo.alt}>
      `}
    ></lit-virtualizer>
  `;
}
```

#### Performance note

When the `items` array changes, masonry recalculates every item's position in a single pass. This is different from the `flow` and `grid` layouts, which do incremental or on-demand work. In practice the masonry pass is fast enough for moderately large collections, but as collections grow, incremental updates become worth doing — tracked at [#5310](https://github.com/lit/lit/issues/5310). If you hit a layout-performance wall with masonry today, please add a note to that issue with the collection size and the operation that triggered it.

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

Whereas `scrollIntoView()` lets you imperatively scroll a given child element into view, the `pin` property on a virtualizer provides a declarative way to frame an element within the viewport. This is especially useful if you want a specific element to be in view when you initially render a virtualizer. Here's an example:

```js
render() {
  // In this toy example, we pin to a hard-coded position. In reality,
  // you'll almost always want to maintain some state of your own to
  // keep track of whether the virtualizer should be pinned, and to
  // which child element. See the note below about the `unpinned` event.
  return html`
    <h2>My Contacts</h2>
    <lit-virtualizer
      .items=${this.contacts}
      .renderItem=${contact => html`<div>${contact.name}: ${contact.phone}</div>`}
      .pin=${{
        index: 42,
        block: 'start'
      }}
    ></lit-virtualizer>
  `;
}
```

When using the `virtualize` directive, set `pin` in the directive config:

```js
render() {
  return html`
    <div>
      ${virtualize({
        items: this.contacts,
        renderItem: contact => html`<div>${contact.name}: ${contact.phone}</div>`,
        pin: {
          index: 42,
          block: 'start'
        }
      })}
    </div>
  `;
}
```

The `pin` property takes an option called `index` to specify (by number) which child element you want to frame in the viewport. If you want, you can also use the `block` option to indicate how the element should be framed relative to the viewport; `block` behaves identically to the same option in the `scrollIntoView()` method.

When you pin a virtualizer, it remains pinned until the user intentionally scrolls the view, at which point it is automatically "unpinned". When this occurs, the virtualizer fires an `unpinned` event. Unless you're sure you'll only render your virtualizer once, you should listen for the `unpinned` event so you can omit the `pin` property when you re-render the virtualizer and avoid snapping the view back to the previously pinned position. [TODO: link to an example]

> **Note:** Setting `pin` via layout config (e.g., `.layout=${{pin: ...}}`) is deprecated.
> Use the `pin` property directly on the virtualizer as shown above.

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

### Recycled mode (opt-in)

By default, virtualizer renders each visible item by creating a fresh copy of its DOM on every range change. For simple rows this is cheap, but for lists whose rows contain expensive custom elements — data tables with input fields, icon buttons, dropdowns — the per-scroll cost of instantiating fresh row components can add up to noticeable jank during fast scrolling.

**Recycled mode** is an opt-in rendering strategy that keeps a fixed pool of row elements and reuses them across items as the visible range shifts. On a typical scroll step, only one pool slot cycles onto a new item — every other row keeps its current assignment, and its DOM is only moved (via CSS `transform`), not rebuilt. The result is O(1) rendering work per scroll step instead of O(visible range).

#### Enabling recycled mode

On the `<lit-virtualizer>` element, set the `recycle` attribute or property:

```html
<lit-virtualizer
  recycle
  .items="${items}"
  .renderItem="${renderItem}"
></lit-virtualizer>
```

With the `virtualize` directive, set `recycle: true` in the config object:

```js
virtualize({
  recycle: true,
  items,
  renderItem: (item) => html`<my-row .data=${item}></my-row>`,
});
```

#### How it changes the contract

Recycled mode trades per-scroll allocation for a stricter rendering contract. Callers opting in need to accept the following:

- **`renderItem` must express per-row state through bindings.** Because row elements are reused across items, any per-row state that's initialized in the row component's constructor, `connectedCallback`, or `firstUpdated` will persist across reuses and will NOT reset for new items. Row state should live in reactive properties bound from `renderItem`: `html\`<my-row .data=${item}></my-row>\``, not `html\`<my-row></my-row>\`` with per-instance construction logic.

- **Focus may appear to jump between items.** When a slot is recycled, any `activeElement` inside it moves along with the DOM subtree. A user who had focus in item 5's input field will find that same cursor now in item 12's field once item 5 scrolls out of the pool. Apps with focusable row content are responsible for clearing or moving focus on recycle if that behavior is undesirable.

- **CSS transitions and running animations survive recycling.** Timed visual effects attached to a row element are not reset when the row is reassigned to a different item. For lists with animated rows, consider disabling recycled mode or managing animation state explicitly.

- **Per-row lifecycle hooks fire once per pool slot, not once per item.** `connectedCallback`, `disconnectedCallback`, and `firstUpdated` on a row component only fire when a pool slot is created or destroyed. They do NOT fire as items pass through a given slot. Row logic that needs to respond to item changes should subscribe via reactive property updates, not lifecycle hooks.

- **A custom `keyFunction` is ignored when `recycle: true` is set.** The pool uses slot identity, not item keys, for DOM reuse decisions. A one-time console warning is emitted the first time both `recycle` and `keyFunction` are set.

- **Homogeneous rows benefit most.** Lists where every item renders the same template structure (differing only in bound values) get the full reuse benefit. Lists whose items render _different_ templates lose the reuse benefit at boundaries between types — lit-html will tear down a pool slot's content and rebuild it when the template type changes — though everything still renders correctly.

If these constraints don't match your rendering model, leave `recycle` unset; the default (non-recycled) path is unchanged.

#### Pool size

In recycled mode, the pool is sized to cover the visible range plus the `overscan` buffer. The default `overscan: 50` allocates a pool equivalent to roughly 2× the viewport height. To tune the tradeoff between smooth scrolling at buffer edges and total pool memory, adjust the `overscan` property. See the [`overscan` API reference entry](#overscan-property) for details.

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

The virtualizer detects items changes by **array reference equality**, not by content. Reassign `items` to a new array — for example with spread (`[...items, newItem]`) or a returned copy from an immutable operation — whenever you want the virtualizer to pick up the change. Mutating the existing array in place will not trigger a reflow.

### `renderItem` property

Type: `(item: T, index?: number) => TemplateResult`

A function that returns a Lit `TemplateResult`. It will be used to generate a child element for each item in the `items` array.

### `scroller` attribute / property

Type: `Boolean`

Optional. If this attribute is present (or, in the case of the `virtualize` directive, if this property has a truthy value), then the virtualizer itself will be a scroller. Otherwise, the virtualizer will not scroll but will size itself to take up enough space for all of its children, including those that aren't currently present in the DOM.

### `axis` attribute / property

Type: `'block' | 'inline'`

Default: `'block'`

Optional. Controls which CSS logical axis the virtualizer uses to lay out its child elements. Set to `'inline'` for inline-axis scrolling (e.g., a horizontal carousel in a standard vertical document). See [Writing mode and direction](#writing-mode-and-direction) and [Virtualizing on the inline axis](#virtualizing-on-the-inline-axis) for details and examples.

### `pin` property

Type: `{index: number, block?: 'start' | 'center' | 'end' | 'nearest'}`

Optional. Declaratively pin the viewport to a specific item. The viewport remains pinned until the user scrolls, at which point the virtualizer fires an `unpinned` event and the pin is released. Set to `undefined` (or omit) to leave the viewport in its current scroll position. See [Framing a child element within the viewport](#framing-a-child-element-within-the-viewport) for details and examples.

When using the `virtualize` directive, set `pin` in the directive config instead of as an attribute/property.

### `recycle` attribute / property

Type: `boolean`

Default: `false`

Optional. Enables [recycled mode](#recycled-mode-opt-in), in which a fixed pool of row elements is reused across items as the visible range shifts, rather than fresh DOM being rendered for each item on every range change. Significantly reduces per-scroll cost for lists with expensive per-row components. Comes with a stricter rendering contract around focus, per-row state, and lifecycle hooks — see the recycled-mode section above before enabling.

### `overscan` property

Type: `number`

Default: `50`

Optional. Controls how much content beyond the currently visible range to keep rendered as a buffer against scroll. The value is a normalized scale from 0 to 100:

- **0**: Render only the items that are currently intersecting the viewport. No extra buffer. Lowest memory and DOM cost, but visible items may appear with a brief delay on fast scrolls.
- **50** (default): Render approximately half a viewport of extra content on each side of the visible range (2× total coverage). This matches the default behavior of iron-list's `_maxPages: 2` setting and is a reasonable balance between scroll smoothness and memory overhead.
- **100**: Render approximately one full extra viewport on each side (3× total coverage). Maximizes scroll smoothness at the cost of more DOM nodes and layout work.

The exact internal mapping from this normalized value to a pixel buffer may be refined in future versions — the 0–100 scale is the stable API surface.

**Migration note:** Prior versions of lit-virtualizer used a fixed 1000px overhang buffer (the old internal `_overhang` constant). The new default of `50` gives approximately 400–800px of buffer depending on viewport size, which is less than the old fixed value at smaller viewports. If you relied on the old larger buffer, set `overscan: 100` to get a similar (or larger) effect for most viewport sizes.

**In recycled mode**, `overscan` also controls the pool size: the pool is sized to hold enough elements to cover the visible range plus the overscan buffer. Larger `overscan` values allocate more pool slots, reducing reassignments at the edges of the buffer during fast scrolls.

### `scrollToIndex` method

Type: `(index: number, position?: string) => void`

where position is: `'start'|'center'|'end'|'nearest'`

Scroll to the item at the given index. Place the item at the given position within the viewport. For example, if index is `100` and position is `end`, then the bottom of the item at index 100 will be at the bottom of the viewport. Position defaults to `start`.

_Note: Details of the `scrollToIndex` API may change in a future release, but any changes should be minimal and mechanical._

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
