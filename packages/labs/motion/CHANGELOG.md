# Change Log

## 1.0.1

### Patch Changes

- [#2186](https://github.com/lit/lit/pull/2186) [`59acf89a`](https://github.com/lit/lit/commit/59acf89ae77612fe1a91577f9ac0361f4e277a17) Thanks [@sorvell](https://github.com/sorvell)! - Ensures `*.d.ts` files are included in production output.

## 1.0.0

### Patch Changes

- [#2166](https://github.com/lit/lit/pull/2166) [`94dff0a4`](https://github.com/lit/lit/commit/94dff0a4b74877a3de192eb32534c6237bb098a7) - Renamed `animate` option `animateOptions` to `keyframeOptions` and `AnimateController` `animateOptions` to `defaultOptions`

* [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

* [#2166](https://github.com/lit/lit/pull/2166) [`94dff0a4`](https://github.com/lit/lit/commit/94dff0a4b74877a3de192eb32534c6237bb098a7) - Renamed `flip()` to `animate()`

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

- Updated dependencies [[`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74)]:
  - lit@2.0.0

## 1.0.0-rc.4

### Patch Changes

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

- Updated dependencies [[`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b), [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047), [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74)]:
  - lit@2.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* Updated dependencies [[`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - lit@2.0.0-rc.3

- Included `development` folder in release [#1912](https://github.com/lit/lit/issues/1912).

---

Changes below were based on the [Keep a Changelog](http://keepachangelog.com/) format. All changes above are generated automatically by [Changesets](https://github.com/atlassian/changesets).

---

## [1.0.0-rc.2] - 2021-04-07

### Fixed

- Included `flip-controller` in `package.json` `files` section [#1796](https://github.com/lit/lit/issues/1796).

## [1.0.0-rc.1] - 2021-04-20

### Changed

- Updated dependencies

## [1.0.0-pre.1] - 2020-12-16

### Added

- Adds `flip` directive. The `flip` directive animates a node's layout between renders. It will perform a "tweening" animation between the two states based on the options given. In addition, elements can animate when they initially render to DOM and when they are removed. for making elements move from one render to the next.
- Adds `position` directive that positions and sizes an element relative to a given target element.
