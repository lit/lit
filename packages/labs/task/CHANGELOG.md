# Change Log

## 3.1.0

### Minor Changes

- [#4170](https://github.com/lit/lit/pull/4170) [`04c8d65a`](https://github.com/lit/lit/commit/04c8d65ad8dd82c239fc04c478e36eed4d8694c4) - Graduate @lit-labs/task to @lit/task, its permanent location. @lit-labs/task is now just a proxy for @lit/task, so code need not be duplicated in projects that depend on both.

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

## 3.1.0-pre.0

### Minor Changes

- [#4170](https://github.com/lit/lit/pull/4170) [`04c8d65a`](https://github.com/lit/lit/commit/04c8d65ad8dd82c239fc04c478e36eed4d8694c4) - Graduate @lit-labs/task to @lit/task, its permanent location. @lit-labs/task is now just a proxy for @lit/task, so code need not be duplicated in projects that depend on both.

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`04c8d65a`](https://github.com/lit/lit/commit/04c8d65ad8dd82c239fc04c478e36eed4d8694c4)]:
  - @lit/task@1.0.0-pre.0

## 3.0.2

### Patch Changes

- [#4161](https://github.com/lit/lit/pull/4161) [`4fdc47cf`](https://github.com/lit/lit/commit/4fdc47cf71fe345ffc8c68020a74dfdb6850bd31) - Disambiguate `TypeFunction` type to fix type error when providing a task function making use of the abort signal.

## 3.0.1

### Patch Changes

- [#4070](https://github.com/lit/lit/pull/4070) [`3be62b07`](https://github.com/lit/lit/commit/3be62b07acfb3452aab9c8901f3383237ca69f05) Thanks [@mlcui-google](https://github.com/mlcui-google)! - Fix Task.render()'s return type always being undefined

## 3.0.0

### Major Changes

- [#4004](https://github.com/lit/lit/pull/4004) [`5beb5f9a`](https://github.com/lit/lit/commit/5beb5f9acbb5edb4f8df179d0e93fe4c9ae59b51) - Adds the `'afterUpdate'` option for `autoRun` to Task, and runs tasks by default in `hostUpdate()` instead of `hostUpdated()`. `'afterUpdate'` is needed to run tasks dependent on DOM updates, but will cause multiple renders of the host element.

- [#4013](https://github.com/lit/lit/pull/4013) [`a5bf2507`](https://github.com/lit/lit/commit/a5bf250770e6527e209eb6201761065ab2196179) - Add pluggable task args equality functions and deepArrayEquals. Breaking: this removes performTask() and shouldRun() protected methods.

### Minor Changes

- [#3998](https://github.com/lit/lit/pull/3998) [`937f4e9b`](https://github.com/lit/lit/commit/937f4e9ba6cf200c2112a55f1d6f572cb4fcadd3) - Allow cancelling a task with a Task.abort() method

- [#3996](https://github.com/lit/lit/pull/3996) [`012e8bc8`](https://github.com/lit/lit/commit/012e8bc874ac1128f4c719648a3a8c9f29d43b7d) - Provide an AbortSignal to task functions

- [#4001](https://github.com/lit/lit/pull/4001) [`2ce10e4d`](https://github.com/lit/lit/commit/2ce10e4d879c5a342357f7e36a2a1de76b0cd625) - Allow tasks to have an initial value

### Patch Changes

- [#4008](https://github.com/lit/lit/pull/4008) [`fd7e7cdf`](https://github.com/lit/lit/commit/fd7e7cdf771d71efb02f3945c14dadd1c4d95130) - Infer the return type of Task.render()

## 2.1.2

### Patch Changes

- [#3953](https://github.com/lit/lit/pull/3953) [`2407c808`](https://github.com/lit/lit/commit/2407c808007268c1f96f14e311eb36d525080968) - Fix taskComplete not rejecting if after an error state

- [#3947](https://github.com/lit/lit/pull/3947) [`0480e006`](https://github.com/lit/lit/commit/0480e00633e15740640f9ce937573085e91848b2) - Task will not throw errors unless user requests taskComplete

## 2.1.1-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`be72f66b`](https://github.com/lit/lit/commit/be72f66bd9aab5d0586729fb5be4bac4aa27cb7f), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7), [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - @lit/reactive-element@2.0.0-pre.0

## 2.1.1

### Patch Changes

- [#3847](https://github.com/lit/lit/pull/3847) [`b3625853`](https://github.com/lit/lit/commit/b36258534e6cce799297e837dadbd4bc37ab49fa) - Add a missing await in performTask

## 2.1.0

### Minor Changes

- [#3660](https://github.com/lit/lit/pull/3660) [`65df149f`](https://github.com/lit/lit/commit/65df149f761ff4052beb064386bd59f568a87154) - Fix the change-in-update warning from Tasks by delaying the initial host update

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
