## [0.7.0-pre.3] - 2022-03-16
### Changed
- Extracted LitVirtualizer class to be imported without side-effects

## [0.6.0] - 2021-05-01
- This is a stopgap release to unblock migrations to Lit 2.0
- In the near future:
  - Source will move to the Lit monorepo
  - Subsequent releases will likely be as `@lit-labs/virtualizer`

### Changed
- Migrated to Lit 2.x

## [0.5.0] - 2021-05-01
### Changed
- Significant refactoring
- Now emits custom events, access data from `detail` object

### Added
- Support for older browsers (IE11, legacy Edge)
- Benchmarking support (subject to change)
- Work-in-progress grid layouts, not ready for use

## [0.4.2] - 2019-11-15
### Changed
- Appended `.js` to all local imports.
- Capitalized `Layout` import in Layout1dBase.

## [0.4.1] - 2019-09-24
### Changed
- Rollup plugins moved to dev dependencies.
- Bumped rollup-plugin-terser version.

## [0.4.0] - 2019-08-19
### Added
- Type declarations.

### Fixed
- lit-html and LitElement versions.

## [0.3.0] - 2019-07-18
### Added
- `firstVisible` and `lastVisible` on `RangeChangeEvent`.

## [0.2.0] - 2019-07-15
### Added
- `scrollToIndex` method on `<lit-virtualizer>`.
- `scrollToIndex` configuration option on `scroll` directive.

### Changed
- Renamed API option `template` to `renderItem`.

## [0.1.0] - 2019-06-05
- Initial prerelease.
