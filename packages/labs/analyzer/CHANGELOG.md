# @lit-labs/analyzer

## 0.3.0

### Minor Changes

- [#3304](https://github.com/lit/lit/pull/3304) [`31bed8d6`](https://github.com/lit/lit/commit/31bed8d6542c44a64bad8282b9ce5e5d6514e44a) - Added support for analyzing JavaScript files.

- [#3288](https://github.com/lit/lit/pull/3288) [`569a6237`](https://github.com/lit/lit/commit/569a6237377eeef0c8dced2c369c77ebdd81218e) - Refactored Analyzer into better fit for use in plugins. Analyzer class now takes a ts.Program, and PackageAnalyzer takes a package path and creates a program to analyze a package on the filesystem.

- [#3254](https://github.com/lit/lit/pull/3254) [`fc2fd4c8`](https://github.com/lit/lit/commit/fc2fd4c8f4a25b9a85073afcb38614209e079bb9) - Fixes bug where global install of CLI resulted in incompatible use of analyzer between CLI packages. Fixes #3234.

## 0.2.2

### Patch Changes

- [#3116](https://github.com/lit/lit/pull/3116) [`7d185b4e`](https://github.com/lit/lit/commit/7d185b4e882aeca70c7b750d8295d0da34a09cd8) - Upgraded TypeScript version to ~4.7.4

## 0.2.1

### Patch Changes

- [#2976](https://github.com/lit/lit/pull/2976) [`bf13dae2`](https://github.com/lit/lit/commit/bf13dae231d26f350c117271a45e047ee151fc20) - Added Type, Reference, and VariableDeclaration to model

## 0.2.0

### Minor Changes

- [#2822](https://github.com/lit/lit/pull/2822) [`aa57f683`](https://github.com/lit/lit/commit/aa57f6838fa12ec0cb1d1ea0a108edeef67b9ede) - Added basic generation of React wrapper to CLI.

### Patch Changes

- [#2804](https://github.com/lit/lit/pull/2804) [`e0517ccf`](https://github.com/lit/lit/commit/e0517ccf79d983a8d6ec53969f29e130830fe3e8) - Read property options from decorated properties

- [#2896](https://github.com/lit/lit/pull/2896) [`3bd330f3`](https://github.com/lit/lit/commit/3bd330f3db4c2f618181b8602563db3ab879f33d) - Add utilties for getting LitElement declarations

- [#2812](https://github.com/lit/lit/pull/2812) [`93d671fe`](https://github.com/lit/lit/commit/93d671feab82688a79fc60ba22cf204fa4ca02ec) - Read events from class JSDoc @fires tags

## 0.1.1

### Patch Changes

- [#2796](https://github.com/lit/lit/pull/2796) [`a4253b83`](https://github.com/lit/lit/commit/a4253b8396bbfa28bce8cb1c86fd59959474d7dd) - Initial support for finding LitElement declarations

- [#2798](https://github.com/lit/lit/pull/2798) [`a95740dc`](https://github.com/lit/lit/commit/a95740dc27d06ab24828b993e84452cd306feecb) - Refactor LitElement-specific utilties into separate module

- [#2789](https://github.com/lit/lit/pull/2789) [`07212750`](https://github.com/lit/lit/commit/072127503d3dc40fe7ab8add93bebde933b6bd8b) - Add minimal class declaration gathering

## 0.1.0

### Minor Changes

- [#2676](https://github.com/lit/lit/pull/2676) [`df10f6d3`](https://github.com/lit/lit/commit/df10f6d34bd59b736cb723250e0b02b2cc5012e3) - Add initial Analyzer class
