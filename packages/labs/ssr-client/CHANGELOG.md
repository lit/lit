# Change Log

## 1.1.5

### Patch Changes

- [#4311](https://github.com/lit/lit/pull/4311) [`cabe72a8`](https://github.com/lit/lit/commit/cabe72a863a5de14a4bbca384374db748dd9b4c5) - Update version range for `lit` dependency to include v2. This allows projects still on lit v2 to use this package without being forced to install lit v3.

- [#4312](https://github.com/lit/lit/pull/4312) [`26182733`](https://github.com/lit/lit/commit/26182733046e347670db01ebf9cec5b0b3611523) - Avoid nullish logical assignment in hydrate-lit-html which some minification process would not handle correctly. Fixes hydration errors in Next.js production bundles.

## 1.1.4

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#4081](https://github.com/lit/lit/pull/4081) [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417) - Sync from last stable release

- Updated dependencies:
  - @lit/reactive-element@2.0.0
  - lit-html@3.0.0
  - lit@3.0.0

## 1.1.4-pre.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#4081](https://github.com/lit/lit/pull/4081) [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417) - Sync from last stable release

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit/reactive-element@2.0.0-pre.1
  - lit-html@3.0.0-pre.1
  - lit@3.0.0-pre.1

## 1.1.2-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`be72f66b`](https://github.com/lit/lit/commit/be72f66bd9aab5d0586729fb5be4bac4aa27cb7f), [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - @lit/reactive-element@2.0.0-pre.0
  - lit-html@3.0.0-pre.0
  - lit@3.0.0-pre.0

## 1.1.3

### Patch Changes

- [#3993](https://github.com/lit/lit/pull/3993) [`e2c50569`](https://github.com/lit/lit/commit/e2c50569c48849a9863e31dfd74a71bb4eb4524d) - Add better error message during hydration when throwing on `CompiledTemplate`s.

- Updated dependencies [[`e2c50569`](https://github.com/lit/lit/commit/e2c50569c48849a9863e31dfd74a71bb4eb4524d), [`8057c78d`](https://github.com/lit/lit/commit/8057c78def09e345e68c3fc009b8ab9d6cf1c0f2)]:
  - lit-html@2.8.0
  - lit@2.8.0

## 1.1.2

### Patch Changes

- [#3901](https://github.com/lit/lit/pull/3901) [`82e9f370`](https://github.com/lit/lit/commit/82e9f3708973709e916ccbb6d8a450110dea7755) - Bump minimum version of `lit-html` dependency to 2.7.1 which includes needed shared internals.

## 1.1.1

### Patch Changes

- [#3781](https://github.com/lit/lit/pull/3781) [`41b18f30`](https://github.com/lit/lit/commit/41b18f3004163e9011c822dddf73a8669e3c74d8) - Include node build output in npm package. Fixes "Cannot find module ... ssr-client/node/index.js" errors.

## 1.1.0

### Minor Changes

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - `lit-html/experimental-hydrate.js` and `lit-element/experimental-hydrate-support.js` have been moved to `@lit-labs/ssr-client`.

  The modules in the original location have been marked deprecated and will be removed in a future version.

## 1.0.1

### Patch Changes

- [#2410](https://github.com/lit/lit/pull/2410) [`b9a6962b`](https://github.com/lit/lit/commit/b9a6962b84c841eaabd5c4cbf8687ff34dbfe511) - Correct the link path of CONTRIBUTING.md in README.md files

## 1.0.0

### Patch Changes

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

* [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* Updated dependencies [[`ff0d1556`](https://github.com/lit/lit/commit/ff0d15568fe79019ebfa6b72b88ba86aac4af91b), [`b3121ab7`](https://github.com/lit/lit/commit/b3121ab7ce71d6947d1081995e962806f32bc5ea), [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b), [`2b8dd1c7`](https://github.com/lit/lit/commit/2b8dd1c7d687a8613bd97eb68a2dfd9197cde4fa), [`d6b385e3`](https://github.com/lit/lit/commit/d6b385e3e4ae2ff23c1ecc3164fa7bb1a20c7dd5), [`34280cb0`](https://github.com/lit/lit/commit/34280cb0c6ac1dc14ce5cc900f36b4326b0a1d98), [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257), [`8189f094`](https://github.com/lit/lit/commit/8189f09406a5ee2f2c7351884486944fd46e1d5b), [`018f6520`](https://github.com/lit/lit/commit/018f65205ba256e15410f17a69f958607c222a38), [`b4bd9f7c`](https://github.com/lit/lit/commit/b4bd9f7c7d036da8667cbd7075af4f6d6f27bc32), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`69389958`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302), [`0470d86a`](https://github.com/lit/lit/commit/0470d86a2075b401184e5d5d514de3fa8f75dd16), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`52a47c7e`](https://github.com/lit/lit/commit/52a47c7e25d71ff802083ca9b0751724efd3a4f4), [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`08f60328`](https://github.com/lit/lit/commit/08f60328abf83113fe82c9d8ee43dc71f10a9b77), [`7adfbb0c`](https://github.com/lit/lit/commit/7adfbb0cd32a7eab82551aa6c9d1434e7c4b563e), [`d8ff5901`](https://github.com/lit/lit/commit/d8ff590120c2ac4830a1e4917a57a839c8011e39), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`24feb430`](https://github.com/lit/lit/commit/24feb4306ec3ddf2996c678a266a211b52f6aff2), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`61fc9452`](https://github.com/lit/lit/commit/61fc9452b40140bbd864317d868a3a663538ebdd), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`0b4d6eda`](https://github.com/lit/lit/commit/0b4d6eda5220aeb53abe250217d70dcb8f45fe43), [`13d137e9`](https://github.com/lit/lit/commit/13d137e96456e8243fa5e3dbfbaf8d8e510016a7), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`f05be301`](https://github.com/lit/lit/commit/f05be301e36fce93ae887007c0bdd328e5434225), [`01353317`](https://github.com/lit/lit/commit/013533178ded7fb5e533e15f6dc982de25d12b94), [`a48f39c8`](https://github.com/lit/lit/commit/a48f39c8d5872dbc9a19a9bc72b22692950071f5), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`724a9aab`](https://github.com/lit/lit/commit/724a9aabe263fb9dafee073e74de50a1aeabbe0f), [`0d703bfb`](https://github.com/lit/lit/commit/0d703bfbc9eb515a6bba8bf5ca608bbcd60fee98), [`56e8efd3`](https://github.com/lit/lit/commit/56e8efd3fc654396421e7024f82f0eac9d2c4d33), [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74), [`e5667d66`](https://github.com/lit/lit/commit/e5667d66f4da58e74206fdef526b1c21a6e45925), [`8b6e2415`](https://github.com/lit/lit/commit/8b6e2415e57df644189a5aac311f58949a1d0971), [`cc5c3a09`](https://github.com/lit/lit/commit/cc5c3a09a150bd19ce5445333dfb3799d33e03de), [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0), [`043a16fb`](https://github.com/lit/lit/commit/043a16fbfbd55c71fbee399691537765277694ea), [`761375ac`](https://github.com/lit/lit/commit/761375ac9ef28dd0ba8a1f9363aaf5f0df725205), [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - lit-html@2.0.0
  - @lit/reactive-element@1.0.0
  - lit@2.0.0

## 1.0.0-rc.3

### Patch Changes

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

* [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

## 1.0.0-rc.2

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* Updated dependencies [[`ff0d1556`](https://github.com/lit/lit/commit/ff0d15568fe79019ebfa6b72b88ba86aac4af91b), [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257), [`69389958`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`52a47c7e`](https://github.com/lit/lit/commit/52a47c7e25d71ff802083ca9b0751724efd3a4f4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`f05be301`](https://github.com/lit/lit/commit/f05be301e36fce93ae887007c0bdd328e5434225), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`56e8efd3`](https://github.com/lit/lit/commit/56e8efd3fc654396421e7024f82f0eac9d2c4d33), [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0), [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - lit-html@2.0.0-rc.4

- Included `development` folder in release [#1912](https://github.com/lit/lit/issues/1912).

---

Changes below were based on the [Keep a Changelog](http://keepachangelog.com/) format. All changes above are generated automatically by [Changesets](https://github.com/atlassian/changesets).

---

## 1.0.0-rc.1 - 2021-04-20

### Changed

- Updated dependencies.

## 1.0.0-pre.1 - 2021-03-31

### Added

- Adds `renderLight` directive, a child-position directive that invokes and
  renders the parent custom element's `renderLight` method as its value.
