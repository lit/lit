# @lit-labs/cli

## 0.6.2

### Patch Changes

- Updated dependencies [[`2896209b`](https://github.com/lit/lit/commit/2896209b925169793898b10dc3409de4056c93f7), [`7a9804ad`](https://github.com/lit/lit/commit/7a9804adc676eb2e84252d31d600e59032b0482a)]:
  - @lit-labs/analyzer@0.11.0

## 0.6.1

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies:
  - @lit-labs/gen-utils@0.3.0
  - @lit/localize-tools@0.7.0
  - @lit-labs/analyzer@0.10.0

## 0.6.1-pre.0

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5)]:
  - @lit-labs/gen-utils@0.3.0-pre.0
  - @lit/localize-tools@0.7.0-pre.1
  - @lit-labs/analyzer@0.10.0-pre.0

## 0.6.0

### Minor Changes

- [#4030](https://github.com/lit/lit/pull/4030) [`55bfed2f`](https://github.com/lit/lit/commit/55bfed2f95cfcf10757e24edf56092b8e9d36405) - Upgrade TypeScript to ~5.0

### Patch Changes

- Updated dependencies [[`9001f9c1`](https://github.com/lit/lit/commit/9001f9c12e0ba125b930dcc126476e384ddc23fe), [`55bfed2f`](https://github.com/lit/lit/commit/55bfed2f95cfcf10757e24edf56092b8e9d36405), [`91611d73`](https://github.com/lit/lit/commit/91611d73600e163459da5d2bfb9753c88ad3f45a), [`da6646d8`](https://github.com/lit/lit/commit/da6646d827d8932ba7c241780cbd03a9ade64009)]:
  - @lit-labs/analyzer@0.9.0

## 0.5.0

### Minor Changes

- [#3866](https://github.com/lit/lit/pull/3866) [`d8e80656`](https://github.com/lit/lit/commit/d8e806561e2d5c12bc99fcee34bce1825c3ca1ae) - The analyzer no longer crashes in many cases when encountering code with unexpected syntax or cases that the analyzer does not yet handle. The custom elements manifest generator also logs diagnostics collected while generating the manifest, but generates the manifest whenever possible.

### Patch Changes

- Updated dependencies [[`d8e80656`](https://github.com/lit/lit/commit/d8e806561e2d5c12bc99fcee34bce1825c3ca1ae)]:
  - @lit-labs/analyzer@0.8.0

## 0.4.1-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa)]:
  - @lit/localize-tools@0.7.0-pre.0
  - @lit-labs/gen-utils@0.2.2-pre.0
  - @lit-labs/analyzer@0.6.1-pre.0

## 0.4.1

### Patch Changes

- Updated dependencies [[`2c59ceb9`](https://github.com/lit/lit/commit/2c59ceb9427ca76a591084258eedab76644f2a63)]:
  - @lit-labs/analyzer@0.7.0

## 0.4.0

### Minor Changes

- [#3529](https://github.com/lit/lit/pull/3529) [`389d0c55`](https://github.com/lit/lit/commit/389d0c558d78982d8265588d1935ede91f46f3a0) - Added CLI improvements:

  - Add support for --exclude options (important for excluding test files from e.g. manifest or wrapper generation)

  Added more analysis support and manifest emit:

  - TS enum type variables
  - description, summary, and deprecated for all models
  - module-level description & summary
  - ClassField and ClassMethod

### Patch Changes

- Updated dependencies [[`dfdc3f71`](https://github.com/lit/lit/commit/dfdc3f714e511d30acc28809fa6643a4c764cad1), [`cabc6189`](https://github.com/lit/lit/commit/cabc61894e57ba89ecadc1deb20f121fecdfffc9), [`b7b01c0d`](https://github.com/lit/lit/commit/b7b01c0d21c0ac301cd5b8d4cb595f3bbfeebe6b), [`520b4713`](https://github.com/lit/lit/commit/520b47132af8e21868df5dc4dfdf5e003a38d158), [`39ac5275`](https://github.com/lit/lit/commit/39ac52758064dc521c2e3701e28348d7dc637a98), [`7e20a528`](https://github.com/lit/lit/commit/7e20a5287a46eadcd06a0804147b3b27110326ad), [`389d0c55`](https://github.com/lit/lit/commit/389d0c558d78982d8265588d1935ede91f46f3a0)]:
  - @lit-labs/analyzer@0.6.0

## 0.3.0

### Minor Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - changed lit init --dir flag to --out

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Added superclass analysis to ClassDeclaration, along with the ability to query exports of a Module (via `getExport()` and `getResolvedExport()`) and the ability to dereference `Reference`s to the `Declaration` they point to (via `dereference()`). A ClassDeclaration's superClass may be interrogated via `classDeclaration.heritage.superClass.dereference()` (`heritage.superClass` returns a `Reference`, which can be dereferenced to access its superclass's `ClassDeclaration` model.

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Implemented lit init element command

### Patch Changes

- Updated dependencies [[`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d), [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d), [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d)]:
  - @lit-labs/analyzer@0.5.0
  - @lit-labs/gen-utils@0.2.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`fc2b1c88`](https://github.com/lit/lit/commit/fc2b1c885211e4334d5ae5637570df85dd2e3f9e), [`ad361cc2`](https://github.com/lit/lit/commit/ad361cc22303f759afbefe60512df34fffdee771)]:
  - @lit-labs/analyzer@0.4.0

## 0.2.0

### Minor Changes

- [#3304](https://github.com/lit/lit/pull/3304) [`31bed8d6`](https://github.com/lit/lit/commit/31bed8d6542c44a64bad8282b9ce5e5d6514e44a) - Added support for analyzing JavaScript files.

- [#2936](https://github.com/lit/lit/pull/2936) [`7a9fc0f5`](https://github.com/lit/lit/commit/7a9fc0f57e43c2eab44e9442e5896f951a8c751a) - Locally version and lazily install the localize command.

### Patch Changes

- Updated dependencies [[`31bed8d6`](https://github.com/lit/lit/commit/31bed8d6542c44a64bad8282b9ce5e5d6514e44a), [`569a6237`](https://github.com/lit/lit/commit/569a6237377eeef0c8dced2c369c77ebdd81218e), [`fc2fd4c8`](https://github.com/lit/lit/commit/fc2fd4c8f4a25b9a85073afcb38614209e079bb9)]:
  - @lit-labs/analyzer@0.3.0

## 0.1.0

### Minor Changes

- [#3225](https://github.com/lit/lit/pull/3225) [`198da7ce`](https://github.com/lit/lit/commit/198da7ceabc944b142a666cae56ea239624cd019) - Initial release
