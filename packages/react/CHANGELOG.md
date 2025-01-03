# Change Log

## 1.0.7

### Patch Changes

- [#4865](https://github.com/lit/lit/pull/4865) [`dd2fdc96`](https://github.com/lit/lit/commit/dd2fdc96441a585f735f3d1daffe65c652bad0df) Thanks [@Artur-](https://github.com/Artur-)! - fix: Widen range for React types to include React 19

## 1.0.6

### Patch Changes

- [#4774](https://github.com/lit/lit/pull/4774) [`25652984`](https://github.com/lit/lit/commit/2565298435d017672a1e7669f176134724c4c806) Thanks [@kyubisation](https://github.com/kyubisation)! - Prevent calling HTMLElement.prototype in SSR

## 1.0.5

### Patch Changes

- [#4575](https://github.com/lit/lit/pull/4575) [`aa4fc3ef`](https://github.com/lit/lit/commit/aa4fc3eff349b202861e597ef7554934b9eaa19a) - Use a global flag to detect whether `@lit-labs/ssr-react/enable-lit-ssr.js` was used for coordinating props when server rendering components made with `@lit/react`.

## 1.0.4

### Patch Changes

- [#4572](https://github.com/lit/lit/pull/4572) [`5ed30d47`](https://github.com/lit/lit/commit/5ed30d47f7c2d5574293a9caf73cdf13a1907dcd) - Fix issue where event handler prop was incorrectly being set on the underlying custom element instance and potentially overriding an existing method/property.

- [#4534](https://github.com/lit/lit/pull/4534) [`d68f5c70`](https://github.com/lit/lit/commit/d68f5c705484b9f6ea1f553d4851a9aa6a440db0) - Wrapped components will now keep track of JSX props from previous render that were set as a property on the element, but are now missing, and set the property to `undefined`. Note, wrapped components still do not have "default props" and missing props will be treated the same as explicitly passing in `undefined`.

  This fixes the previously unexpected behavior where the following JSX when first rendered with a truthy condition

  ```jsx
  return condition ? <WrappedInput disabled /> : <WrappedInput />;
  ```

  would leave the `disabled` property and reflected attribute to be `true` even when the condition turns falsey.

## 1.0.3

### Patch Changes

- [#4485](https://github.com/lit/lit/pull/4485) [`57b00630`](https://github.com/lit/lit/commit/57b006306c269bd835979935dae3062599c4fccf) - Add "browser" export condition entrypoints to any package.json files with "node"
  export conditions. This fixes Node test runners emulating browser environments that were incorrectly loading the
  "node" entrypoints instead of the browser code.

## 1.0.2

### Patch Changes

- [#4381](https://github.com/lit/lit/pull/4381) [`001a1b78`](https://github.com/lit/lit/commit/001a1b78074aa799946c0db798bacc1ba1422cbf) - Prefer type of property from an element over built-in React HTMLAttribute types. This also fixes type errors that would arise when they collide and can't be intersected.

## 1.0.1

### Patch Changes

- [#4335](https://github.com/lit/lit/pull/4335) [`7fc72f7b`](https://github.com/lit/lit/commit/7fc72f7b1769d80961229537606083371a7dc1e8) Thanks [@stefanpearson](https://github.com/stefanpearson)! - When passing a `ref` callback to the Component, `createComponent` was previously intercepting it and wrapping it in an unbound function. This change memoizes the consumer `ref` with `useCallback`, to keep the reference stable and ensure it isn't invoked repeatedly on subsequent renders.

## 1.0.0

### Major Changes

- [#4224](https://github.com/lit/lit/pull/4224) [`71526898`](https://github.com/lit/lit/commit/71526898cc33ff8a466b9dcabb89d601ec862b9a) - Graduate @lit-labs/react to @lit/react, its permanent location. @lit-labs/react is now just a proxy for @lit/react, so code need not be duplicated in projects that depend on both.

## 1.0.0-pre.0

### Major Changes

- [#4224](https://github.com/lit/lit/pull/4224) [`71526898`](https://github.com/lit/lit/commit/71526898cc33ff8a466b9dcabb89d601ec862b9a) - Graduate @lit-labs/react to @lit/react, its permanent location. @lit-labs/react is now just a proxy for @lit/react, so code need not be duplicated in projects that depend on both.

## 1.0.0

## Initial release!

@lit/react graduated from its previous location at @lit-labs/react.

For details on its changelog before graduating, see https://github.com/lit/lit/blob/main/packages/labs/react/CHANGELOG.md
