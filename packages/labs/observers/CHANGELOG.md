# @lit-labs/observers

## 1.1.0

### Minor Changes

- [#3294](https://github.com/lit/lit/pull/3294) [`96c05f25`](https://github.com/lit/lit/commit/96c05f258183066b34d2253c57552ef41ed4581a) - Fix value property of type `unknown` on exported controllers. The type of
  `value` is now generic and can be inferred from the return type of your passed
  in `callback`. The default callback `() => true` was removed, and is now
  undefined by default.

### Patch Changes

- [#3293](https://github.com/lit/lit/pull/3293) [`7e22bc2e`](https://github.com/lit/lit/commit/7e22bc2e3918e36c0e46aa6430c17eb8f557968f) - Fix controllers not observing changes to target element if initialized after the host has connected.

## 1.0.2

### Patch Changes

- [#3132](https://github.com/lit/lit/pull/3132) [`2fe2053f`](https://github.com/lit/lit/commit/2fe2053fe04e7226e5fa4e8b730e91a62a547b27) - Added "types" entry to package exports. This tells newer versions of TypeScript where to look for typings for each module.

## 1.0.1

### Patch Changes

- [#2402](https://github.com/lit/lit/pull/2402) [`a638841d`](https://github.com/lit/lit/commit/a638841d8ba76e43cf83a2516e2cfc7a9c2ce27e) - Trivial: reformat markdown files

- [#2410](https://github.com/lit/lit/pull/2410) [`b9a6962b`](https://github.com/lit/lit/commit/b9a6962b84c841eaabd5c4cbf8687ff34dbfe511) - Correct the link path of CONTRIBUTING.md in README.md files

## 1.0.0

### Major Changes

- [#2340](https://github.com/lit/lit/pull/2340) [`e1c88265`](https://github.com/lit/lit/commit/e1c8826533d89b99b6c9e2192428337c496d6dd0) - A set of reactive controllers that facilitate using the platform observer objects, including MutationObserver, ResizeObserver, IntersectionObserver, and PerformanceObserver.

### Patch Changes

- Updated dependencies [[`08e7fc56`](https://github.com/lit/lit/commit/08e7fc566894d1916dc768c0843fce962ca4d6d4), [`eb5c5d2b`](https://github.com/lit/lit/commit/eb5c5d2b2159dcd8b2321fa9a221b8d56d127a11), [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db), [`26e3fb7b`](https://github.com/lit/lit/commit/26e3fb7ba1d3ef778a9862ff73374802b4b4eb2e)]:
  - @lit/reactive-element@1.1.0
