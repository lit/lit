# @lit-labs/observers

## 2.0.2

### Patch Changes

- [#4299](https://github.com/lit/lit/pull/4299) [`fffa4406`](https://github.com/lit/lit/commit/fffa44066e06bdbec2d2e28166b7c81b11a8c213) - Update version range for `lit` dependency to include v2 (and/or `@lit/reactive-element` v1). This allows projects still on lit v2 to use this package without being forced to install lit v3.

## 2.0.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies:
  - @lit/reactive-element@2.0.0

## 2.0.1-pre.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit/reactive-element@2.0.0-pre.1

## 2.0.1-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`be72f66b`](https://github.com/lit/lit/commit/be72f66bd9aab5d0586729fb5be4bac4aa27cb7f), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7), [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - @lit/reactive-element@2.0.0-pre.0

## 2.0.0

### Major Changes

- [#3771](https://github.com/lit/lit/pull/3771) [`89da3d80`](https://github.com/lit/lit/commit/89da3d802e506a7400bc415ef77c2bfffce8ffa6) - Change filenames to match project convention: replace `_` with `-`.

## 1.1.0

### Minor Changes

- [#3294](https://github.com/lit/lit/pull/3294) [`96c05f25`](https://github.com/lit/lit/commit/96c05f258183066b34d2253c57552ef41ed4581a) - Fix value property of type `unknown` on exported controllers. The type of
  `value` is now generic and can be inferred from the return type of your passed
  in `callback`. The default callback `() => true` was removed, and is now
  undefined by default.

- [#3323](https://github.com/lit/lit/pull/3323) [`0f787b29`](https://github.com/lit/lit/commit/0f787b290af1ce68498ddb8fb0ab32b9d6698dc6) - Add unobserve method to `ResizeController` and `IntersectionController`.

### Patch Changes

- [#3293](https://github.com/lit/lit/pull/3293) [`7e22bc2e`](https://github.com/lit/lit/commit/7e22bc2e3918e36c0e46aa6430c17eb8f557968f) - Fix controllers not observing changes to target element if initialized after the host has connected.

- [#3321](https://github.com/lit/lit/pull/3321) [`e90e8fe9`](https://github.com/lit/lit/commit/e90e8fe99423c264827564dcc98236d0329a118a) - Controllers now track all observed targets and will restore observing targets
  when host is reconnected.

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
