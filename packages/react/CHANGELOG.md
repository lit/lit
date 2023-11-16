# Change Log

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
