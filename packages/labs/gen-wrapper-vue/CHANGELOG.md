# @lit-labs/gen-wrapper-vue

## 0.2.0

### Minor Changes

- [#3304](https://github.com/lit/lit/pull/3304) [`31bed8d6`](https://github.com/lit/lit/commit/31bed8d6542c44a64bad8282b9ce5e5d6514e44a) - Added support for analyzing JavaScript files.

- [#3288](https://github.com/lit/lit/pull/3288) [`569a6237`](https://github.com/lit/lit/commit/569a6237377eeef0c8dced2c369c77ebdd81218e) - Refactored Analyzer into better fit for use in plugins. Analyzer class now takes a ts.Program, and PackageAnalyzer takes a package path and creates a program to analyze a package on the filesystem.

- [#3254](https://github.com/lit/lit/pull/3254) [`fc2fd4c8`](https://github.com/lit/lit/commit/fc2fd4c8f4a25b9a85073afcb38614209e079bb9) - Fixes bug where global install of CLI resulted in incompatible use of analyzer between CLI packages. Fixes #3234.

### Patch Changes

- Updated dependencies [[`31bed8d6`](https://github.com/lit/lit/commit/31bed8d6542c44a64bad8282b9ce5e5d6514e44a), [`569a6237`](https://github.com/lit/lit/commit/569a6237377eeef0c8dced2c369c77ebdd81218e), [`fc2fd4c8`](https://github.com/lit/lit/commit/fc2fd4c8f4a25b9a85073afcb38614209e079bb9)]:
  - @lit-labs/analyzer@0.3.0

## 0.1.1

### Patch Changes

- [#3233](https://github.com/lit/lit/pull/3233) [`fc3304d2`](https://github.com/lit/lit/commit/fc3304d27c6e63ddaa48f09e222d88fa271ff5ea) - Add lib files to package.

## 0.1.0

### Minor Changes

- [#3225](https://github.com/lit/lit/pull/3225) [`198da7ce`](https://github.com/lit/lit/commit/198da7ceabc944b142a666cae56ea239624cd019) - Initial release
