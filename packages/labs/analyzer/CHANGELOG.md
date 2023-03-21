# @lit-labs/analyzer

## 0.6.0

### Minor Changes

- [#3621](https://github.com/lit/lit/pull/3621) [`dfdc3f71`](https://github.com/lit/lit/commit/dfdc3f714e511d30acc28809fa6643a4c764cad1) - Added analysys of vanilla custom elements that extend HTMLElement.

- [#3662](https://github.com/lit/lit/pull/3662) [`cabc6189`](https://github.com/lit/lit/commit/cabc61894e57ba89ecadc1deb20f121fecdfffc9) - Added support for analyzing const variables initialized to class or function expressions as ClassDeclaration and FunctionDeclaration, respectively.

- [#3658](https://github.com/lit/lit/pull/3658) [`b7b01c0d`](https://github.com/lit/lit/commit/b7b01c0d21c0ac301cd5b8d4cb595f3bbfeebe6b) - JSDoc types in TS files now have no effect on the analyzer's output, matching TS itself.

- [#3702](https://github.com/lit/lit/pull/3702) [`520b4713`](https://github.com/lit/lit/commit/520b47132af8e21868df5dc4dfdf5e003a38d158) - Adds support for overloaded functions. Methods of model objects that accept a
  string key will now specifically return the `FunctionDeclaration` of the
  implementation signature of an overloaded function, which has a new `overloads`
  field containing a `FunctionOverloadDeclaration` for each overload signature.

- [#3648](https://github.com/lit/lit/pull/3648) [`39ac5275`](https://github.com/lit/lit/commit/39ac52758064dc521c2e3701e28348d7dc637a98) - Fix support for static class members by storing them in separate maps by name.

- [#3655](https://github.com/lit/lit/pull/3655) [`7e20a528`](https://github.com/lit/lit/commit/7e20a5287a46eadcd06a0804147b3b27110326ad) - Added support for analyzing function declarations.

- [#3529](https://github.com/lit/lit/pull/3529) [`389d0c55`](https://github.com/lit/lit/commit/389d0c558d78982d8265588d1935ede91f46f3a0) - Added CLI improvements:

  - Add support for --exclude options (important for excluding test files from e.g. manifest or wrapper generation)

  Added more analysis support and manifest emit:

  - TS enum type variables
  - description, summary, and deprecated for all models
  - module-level description & summary
  - ClassField and ClassMethod

## 0.5.0

### Minor Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Added support for export, slot, cssPart, and cssProperty to analyzer and manifest generator. Also improved JS project analysis performance.

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Added superclass analysis to ClassDeclaration, along with the ability to query exports of a Module (via `getExport()` and `getResolvedExport()`) and the ability to dereference `Reference`s to the `Declaration` they point to (via `dereference()`). A ClassDeclaration's superClass may be interrogated via `classDeclaration.heritage.superClass.dereference()` (`heritage.superClass` returns a `Reference`, which can be dereferenced to access its superclass's `ClassDeclaration` model.

## 0.4.0

### Minor Changes

- [#3333](https://github.com/lit/lit/pull/3333) [`fc2b1c88`](https://github.com/lit/lit/commit/fc2b1c885211e4334d5ae5637570df85dd2e3f9e) - Cache Module models based on dependencies.

### Patch Changes

- [#2990](https://github.com/lit/lit/pull/2990) [`ad361cc2`](https://github.com/lit/lit/commit/ad361cc22303f759afbefe60512df34fffdee771) - Added initial implementation of custom elements manifest generator (WIP).

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

- [#2896](https://github.com/lit/lit/pull/2896) [`3bd330f3`](https://github.com/lit/lit/commit/3bd330f3db4c2f618181b8602563db3ab879f33d) - Add utilities for getting LitElement declarations

- [#2812](https://github.com/lit/lit/pull/2812) [`93d671fe`](https://github.com/lit/lit/commit/93d671feab82688a79fc60ba22cf204fa4ca02ec) - Read events from class JSDoc @fires tags

## 0.1.1

### Patch Changes

- [#2796](https://github.com/lit/lit/pull/2796) [`a4253b83`](https://github.com/lit/lit/commit/a4253b8396bbfa28bce8cb1c86fd59959474d7dd) - Initial support for finding LitElement declarations

- [#2798](https://github.com/lit/lit/pull/2798) [`a95740dc`](https://github.com/lit/lit/commit/a95740dc27d06ab24828b993e84452cd306feecb) - Refactor LitElement-specific utilities into separate module

- [#2789](https://github.com/lit/lit/pull/2789) [`07212750`](https://github.com/lit/lit/commit/072127503d3dc40fe7ab8add93bebde933b6bd8b) - Add minimal class declaration gathering

## 0.1.0

### Minor Changes

- [#2676](https://github.com/lit/lit/pull/2676) [`df10f6d3`](https://github.com/lit/lit/commit/df10f6d34bd59b736cb723250e0b02b2cc5012e3) - Add initial Analyzer class
