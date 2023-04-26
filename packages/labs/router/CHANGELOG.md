# @lit-labs/router

## 0.1.2-3.0.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - lit@3.0.0-3.0.0

## 0.1.1

### Patch Changes

- [#3050](https://github.com/lit/lit/pull/3050) [`5227ca52`](https://github.com/lit/lit/commit/5227ca52863ac6fd9f3ee57d7a6c78ea1e617b56) - Fix a property collision in the minified production build.

## 0.1.0

### Minor Changes

- [#2937](https://github.com/lit/lit/pull/2937) [`d2584ad6`](https://github.com/lit/lit/commit/d2584ad6bc5c7dd36f3e8ab9056587a87027b803) - **[BREAKING]** Router properties prefixed with an underscore have been made
  private. These properties were being renamed in production builds and should not
  have been exposed as part of a public API.

## 0.0.2

### Patch Changes

- [#2838](https://github.com/lit/lit/pull/2838) [`f1b26bfe`](https://github.com/lit/lit/commit/f1b26bfe706ad93a3a312932b0eca5b0261023e0) - Add `fallback` route option to the Routes and Router class. The fallback route
  will always be matched if none of the `routes` match, and implicitly matches to
  the path `/*`.

- [#2831](https://github.com/lit/lit/pull/2831) [`a16fd48c`](https://github.com/lit/lit/commit/a16fd48c549f2d28cdfed814976184e2b11ba2ae) - Update URLPattern polyfill dependency, and fix types. The params passed into
  `render` and `enter` may contain `undefined` values as [Unmatched optional
  groups are set to undefined instead of
  ''](https://github.com/kenchris/urlpattern-polyfill/issues/66).

## 0.0.1

### Patch Changes

- [#2331](https://github.com/lit/lit/pull/2331) [`f6736088`](https://github.com/lit/lit/commit/f6736088fc03ebdb00175487907ca1c597f1b09c) - Add initial implementation of labs/router

## 0.0.1

### Patch Changes

- [#2330](https://github.com/lit/lit/pull/2330) [`0cafad5a`](https://github.com/lit/lit/commit/0cafad5a19a74d8814069e539b82f734f15fa6a7) - Add labs/router package scaffolding

- Updated dependencies [[`fcc2b3d0`](https://github.com/lit/lit/commit/fcc2b3d0054e69e6f76588ea9f440117b6d0deed), [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db), [`1d563e83`](https://github.com/lit/lit/commit/1d563e830c02a2d1a22e1e939f1ace971b1d1ae7)]:
  - lit@2.1.0
