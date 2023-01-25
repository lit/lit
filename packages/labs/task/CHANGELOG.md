# Change Log

## 2.0.0

### Major Changes

- [#3283](https://github.com/lit/lit/pull/3283) [`a279803d`](https://github.com/lit/lit/commit/a279803d14dd0d0e81d49063587965581bdc759a) - **[Breaking]** Task will no longer reset its `value` or `error` on pending. This allows us to start chaining tasks e.g.

  ```js
  const a = new Task(
    this,
    async ([url]) => await fetch(url),
    () => [this.url]
  );
  const b = new Task(
    this,
    async ([value]) => {
      /* This is not thrashed */
    },
    () => [a.value]
  );
  ```

### Minor Changes

- [#3287](https://github.com/lit/lit/pull/3287) [`02b0b7b9`](https://github.com/lit/lit/commit/02b0b7b9f99b85de34e56168cf4ccb6955f4c553) - Adds onComplete and onError callbacks

## 1.1.3

### Patch Changes

- [#3131](https://github.com/lit/lit/pull/3131) [`ec87d529`](https://github.com/lit/lit/commit/ec87d5297cba77c4272e89c69d0b1bd0e2ec6823) - Update Task typings to work better with inference and casting args to `as const` by making args a readonly array.

- [#3132](https://github.com/lit/lit/pull/3132) [`2fe2053f`](https://github.com/lit/lit/commit/2fe2053fe04e7226e5fa4e8b730e91a62a547b27) - Added "types" entry to package exports. This tells newer versions of TypeScript where to look for typings for each module.

## 1.1.2

### Patch Changes

- [#2582](https://github.com/lit/lit/pull/2582) [`24cb1568`](https://github.com/lit/lit/commit/24cb156832fe14b0f96d7041c73a35afa893718d) - Fix example code syntax in lit-labs/task README

## 1.1.1

### Patch Changes

- [#2410](https://github.com/lit/lit/pull/2410) [`b9a6962b`](https://github.com/lit/lit/commit/b9a6962b84c841eaabd5c4cbf8687ff34dbfe511) - Correct the link path of CONTRIBUTING.md in README.md files

## 1.1.0

### Minor Changes

- [#2336](https://github.com/lit/lit/pull/2336) [`48394303`](https://github.com/lit/lit/commit/483943034a62bded13eca0c982ff7c93ac6639b6) - Tasks with no arguments now run by default. When a task runs can be customized by passing a `canRun` function.

* [#2336](https://github.com/lit/lit/pull/2336) [`48394303`](https://github.com/lit/lit/commit/483943034a62bded13eca0c982ff7c93ac6639b6) - Tasks now run whenever their arguments change. Disable this by setting `autoRun` to `false`, either on the task config or on the task itself. Tasks can be explicitly run by calling `run` and optionally passing custom args.

### Patch Changes

- Updated dependencies [[`08e7fc56`](https://github.com/lit/lit/commit/08e7fc566894d1916dc768c0843fce962ca4d6d4), [`eb5c5d2b`](https://github.com/lit/lit/commit/eb5c5d2b2159dcd8b2321fa9a221b8d56d127a11), [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db), [`26e3fb7b`](https://github.com/lit/lit/commit/26e3fb7ba1d3ef778a9862ff73374802b4b4eb2e)]:
  - @lit/reactive-element@1.1.0

## 1.0.0

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

- Updated dependencies [[`ff0d1556`](https://github.com/lit/lit/commit/ff0d15568fe79019ebfa6b72b88ba86aac4af91b), [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b), [`2b8dd1c7`](https://github.com/lit/lit/commit/2b8dd1c7d687a8613bd97eb68a2dfd9197cde4fa), [`34280cb0`](https://github.com/lit/lit/commit/34280cb0c6ac1dc14ce5cc900f36b4326b0a1d98), [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257), [`018f6520`](https://github.com/lit/lit/commit/018f65205ba256e15410f17a69f958607c222a38), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`0470d86a`](https://github.com/lit/lit/commit/0470d86a2075b401184e5d5d514de3fa8f75dd16), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`52a47c7e`](https://github.com/lit/lit/commit/52a47c7e25d71ff802083ca9b0751724efd3a4f4), [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`08f60328`](https://github.com/lit/lit/commit/08f60328abf83113fe82c9d8ee43dc71f10a9b77), [`7adfbb0c`](https://github.com/lit/lit/commit/7adfbb0cd32a7eab82551aa6c9d1434e7c4b563e), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`24feb430`](https://github.com/lit/lit/commit/24feb4306ec3ddf2996c678a266a211b52f6aff2), [`61fc9452`](https://github.com/lit/lit/commit/61fc9452b40140bbd864317d868a3a663538ebdd), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`13d137e9`](https://github.com/lit/lit/commit/13d137e96456e8243fa5e3dbfbaf8d8e510016a7), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`724a9aab`](https://github.com/lit/lit/commit/724a9aabe263fb9dafee073e74de50a1aeabbe0f), [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74), [`8b6e2415`](https://github.com/lit/lit/commit/8b6e2415e57df644189a5aac311f58949a1d0971), [`761375ac`](https://github.com/lit/lit/commit/761375ac9ef28dd0ba8a1f9363aaf5f0df725205), [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - @lit/reactive-element@1.0.0

## 1.0.0-rc.4

### Patch Changes

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

## 1.0.0-rc.3

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

---

Changes below were based on the [Keep a Changelog](http://keepachangelog.com/) format. All changes above are generated automatically by [Changesets](https://github.com/atlassian/changesets).

---

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [x.y.z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Removed -->
<!-- ### Fixed -->

## Unreleased

### Fixed

- Included `development` folder in release [#1912](https://github.com/lit/lit/issues/1912).

## 1.0.0-rc.2 - 2021-05-07

### Fixed

- Added `task.js` to the package exports ([#1824](https://github.com/lit/lit/issues/1824)).

## 1.0.0-rc.1 - 2021-04-20

### Changed

- Updated dependencies

## 1.0.0-pre.2 - 2021-03-31

### Changed

- Added result and dependency type arguments to Task

### Added

- Added an `initialState` sentinel value that task functions can return to reset the task state to INITIAL.

<!-- ### Removed -->
<!-- ### Fixed -->

## [1.0.0-pre.1] - 2021-02-11

### Added

- Adds `Task` controller which can be used to perform tasks when a host element updates. When the task completes, an update is requested on the host element and the task value can be used as desired ([#1489](https://github.com/Polymer/lit-html/pulls/1489)).
