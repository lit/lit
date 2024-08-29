# Changelog

## 0.8.0

### Minor Changes

- [#4682](https://github.com/lit/lit/pull/4682) [`290a608a`](https://github.com/lit/lit/commit/290a608aa2297e8b99a5424dc90632b97c66386c) - Update typescript to 5.5.0

### Patch Changes

- Updated dependencies [[`feccc1ba`](https://github.com/lit/lit/commit/feccc1ba8e82b36d07a0e2576381bf2819926b98)]:
  - lit@3.2.0

## 0.7.2

### Patch Changes

- [#4503](https://github.com/lit/lit/pull/4503) [`350147d6`](https://github.com/lit/lit/commit/350147d608cc34fe926dd2bced0e25748c726c59) - Fix an issue where running `extract` on an existing translation target would rewrite the "id" for placeholders signifying the expression index, which breaks translation targets where the expressions need to be reordered.

- [#4530](https://github.com/lit/lit/pull/4530) [`258142d2`](https://github.com/lit/lit/commit/258142d2da9960c0a411308a3f178e6cedb2d93b) - Translated message validation that runs before the `build` step now disregards template literal expressions. This allow source code to have variables in expressions renamed while still keeping the same translations, or avoid errors that could happen from module import order changing which expression gets picked up first when multiple `msg()` calls with the same id have different expressions. This behavior is more consistent with how a translation unit is identified according to [how the message id is generated](https://lit.dev/docs/localization/overview/#id-generation).

- Updated dependencies [[`1a32b61e`](https://github.com/lit/lit/commit/1a32b61ecf09c2c2e6efac2735c2c627af793286), [`57b00630`](https://github.com/lit/lit/commit/57b006306c269bd835979935dae3062599c4fccf)]:
  - lit@3.1.2

## 0.7.1

### Patch Changes

- [#4299](https://github.com/lit/lit/pull/4299) [`fffa4406`](https://github.com/lit/lit/commit/fffa44066e06bdbec2d2e28166b7c81b11a8c213) - Update version range for `lit` dependency to include v2 (and/or `@lit/reactive-element` v1). This allows projects still on lit v2 to use this package without being forced to install lit v3.

## 0.7.0

### Minor Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0, which includes breaking changes to the TypeScript compiler APIs

### Patch Changes

- Updated dependencies:
  - lit@3.0.0
  - @lit/localize@0.12.0

## 0.7.0-pre.1

### Minor Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

### Patch Changes

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17), [`d1e126c4`](https://github.com/lit/lit/commit/d1e126c4a75967ad2cf0c0155b3b2e415e0bc906)]:
  - @lit/localize@0.12.0-pre.1
  - lit@3.0.0-pre.1

## 0.7.0-pre.0

### Minor Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript 5.0, which includes breaking changes to the TypeScript compiler APIs.

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - lit@3.0.0-pre.0
  - @lit/localize@0.11.5-pre.0

## 0.6.10

### Patch Changes

- [#4175](https://github.com/lit/lit/pull/4175) [`84bb0523`](https://github.com/lit/lit/commit/84bb052335605581c88a2071d00b6c2598952122) Thanks [@43081j](https://github.com/43081j)! - Update parse5/tools to simplify importing of node types from the default tree adapter

- [#4168](https://github.com/lit/lit/pull/4168) [`444599eb`](https://github.com/lit/lit/commit/444599eb46d2fa0fa1b348921dfda317d860a327) Thanks [@43081j](https://github.com/43081j)! - Upgrade parse5 to 7.x in localize-tools and import from root of parse5 where possible

## 0.6.9

### Patch Changes

- [#3800](https://github.com/lit/lit/pull/3800) [`c5add753`](https://github.com/lit/lit/commit/c5add75362b61fa331b534fe6291d3264b0d1f93) - Relax the typescript version for compatibility with typescript > 4.7 && < 5.0

## 0.6.8

### Patch Changes

- [#3674](https://github.com/lit/lit/pull/3674) [`52ab0872`](https://github.com/lit/lit/commit/52ab087210ad76f9509028f98a850706bb32f302) - Fix incorrect extraction of html embedded within html

- Updated dependencies [[`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f), [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544)]:
  - lit@2.7.0

## 0.6.7

### Patch Changes

- [#3576](https://github.com/lit/lit/pull/3576) [`6be30739`](https://github.com/lit/lit/commit/6be30739694dd6f09b6cf28c9146db3ee66d1cf1) - Fix regression in Localize XLIFF serialization. When updating an existing XLIFF file, placeholders would appear in the wrong places.

## 0.6.6

### Patch Changes

- [#3514](https://github.com/lit/lit/pull/3514) [`78811714`](https://github.com/lit/lit/commit/78811714eeb00f979e2074a7dd639e8d65903a0f) - - Existing XLIFF files will be updated instead of re-generated, so additional data added by other processes (such as `state="translated"` attributes) will be preserved instead of deleted.
  - XLIFF `<note>` elements generated by Lit Localize will now have a `from="lit-localize"` attribute to distinguish them from other notes.
- Updated dependencies [[`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8)]:
  - lit@2.6.0

## 0.6.5

### Patch Changes

- [#3116](https://github.com/lit/lit/pull/3116) [`7d185b4e`](https://github.com/lit/lit/commit/7d185b4e882aeca70c7b750d8295d0da34a09cd8) - Upgraded TypeScript version to ~4.7.4

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Updated xmldom dependency. Minor change to XML attribute formatting can be expected.

## 0.6.4

### Patch Changes

- [#3092](https://github.com/lit/lit/pull/3092) [`0c9ee0ec`](https://github.com/lit/lit/commit/0c9ee0ec87b831513f04bdd37e9ed434a134f06f) - Dependencies pinned due to breaking changes.

## 0.6.3

### Patch Changes

- [#2732](https://github.com/lit/lit/pull/2732) [`3e181bcb`](https://github.com/lit/lit/commit/3e181bcb3d969775eda799fd6fcae1ead843225b) - Enforce use of file extensions in imports. Fixes an issue with older TypeScript compilers.

## 0.6.2

### Patch Changes

- [#2692](https://github.com/lit/lit/pull/2692) [`c41a92c9`](https://github.com/lit/lit/commit/c41a92c96eeb8c2db4875c94c2eabcd512e044c4) - Fix issue with placing expressions as html attribute values in transform mode

## 0.6.1

### Patch Changes

- [#2561](https://github.com/lit/lit/pull/2561) [`6be4ac29`](https://github.com/lit/lit/commit/6be4ac29d7fe786790471cd3c67217bc7865b4cb) - Reorder xliff `<note>` elements to follow `<target>` elements to be OASIS-compliant

- Updated dependencies [[`2c9d0008`](https://github.com/lit/lit/commit/2c9d00082a416457ee02107013dd4925bf589628)]:
  - lit@2.2.0

## 0.6.0

### Minor Changes

- [#2405](https://github.com/lit/lit/pull/2405) [`4a4afa7b`](https://github.com/lit/lit/commit/4a4afa7bd394938102d8604ec6aff2e9eaf17c88) - **BREAKING** Update analysis to consider messages with same id **and** description to be identical (but no longer checks for expressions to be same) and improve error message on finding incompatible duplicates.

  `lit-localize extract` will now error if multiple messages had the same text but different `desc` option. Be sure to add the same `desc` option for these messages to be considered the same translatable message or add different `id` options to differentiate them.

- [#2405](https://github.com/lit/lit/pull/2405) [`4a4afa7b`](https://github.com/lit/lit/commit/4a4afa7bd394938102d8604ec6aff2e9eaf17c88) - **BREAKING** (XLB format only) Add index to `name` attribute for `<ph>` tags for tracking placeholder locations.

  XLB format users should run `lit-localize extract` to regenerate the `.xlb` file for the source locale and make sure the `<ph>` tags in other locale files have matching `name` attribute values to that of the newly generated source file.

### Patch Changes

- [#2402](https://github.com/lit/lit/pull/2402) [`a638841d`](https://github.com/lit/lit/commit/a638841d8ba76e43cf83a2516e2cfc7a9c2ce27e) - Trivial: reformat markdown files

## 0.5.0

### Minor Changes

- [#2275](https://github.com/lit/lit/pull/2275) [`97f4a3f8`](https://github.com/lit/lit/commit/97f4a3f8f6cd14a8b8ded90ca814335b00ac9a94) - **BREAKING** Placeholders containing HTML markup and dynamic expressions are now
  represented in XLIFF as `<x>` tags instead of `<ph>` tags.

  To preserve the previous behavior of using `<ph>` tags, update your JSON config
  file and set `interchange.placeholderStyle` to `"ph"`:

  ```json
  {
    "interchange": {
      "format": "xliff",
      "placeholderStyle": "ph"
    }
  }
  ```

### Patch Changes

- [#2286](https://github.com/lit/lit/pull/2286) [`52c4f32e`](https://github.com/lit/lit/commit/52c4f32e7aa67120364a9c64a1696909c711ff88) - Update README to point to new full docs at lit.dev

## 0.4.0

### Minor Changes

- [#2188](https://github.com/lit/lit/pull/2188) [`9fc5a039`](https://github.com/lit/lit/commit/9fc5a039dc2b701ac9dbaaea278668172915c80b) - Added output.outputDir setting for transform mode. Required if tsConfig is not specified.

* [#2188](https://github.com/lit/lit/pull/2188) [`9fc5a039`](https://github.com/lit/lit/commit/9fc5a039dc2b701ac9dbaaea278668172915c80b) - Add `inputFiles` field, and make `tsConfig` field optional when `inputFiles` is specified. If both are set, `inputFiles` takes precedence over the input files from `tsConfig`. When `tsConfig` is not specified, a default config is used that will include `.js` files.

### Patch Changes

- [#2188](https://github.com/lit/lit/pull/2188) [`9fc5a039`](https://github.com/lit/lit/commit/9fc5a039dc2b701ac9dbaaea278668172915c80b) - Fixed the `$schema` property that is automatically added to @lit/localize-tools
  config files. It was previously pointing at the incorrect file.
- Updated dependencies [[`9fc5a039`](https://github.com/lit/lit/commit/9fc5a039dc2b701ac9dbaaea278668172915c80b), [`9fc5a039`](https://github.com/lit/lit/commit/9fc5a039dc2b701ac9dbaaea278668172915c80b)]:
  - @lit/localize@0.11.0

## 0.3.7

### Patch Changes

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

* [#2060](https://github.com/lit/lit/pull/2060) [`dddbe0c7`](https://github.com/lit/lit/commit/dddbe0c7627a7c1f750da69c3200d373155b1d74) - Update TypeScript

* Updated dependencies [[`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74)]:
  - lit@2.0.0
  - @lit/localize@0.10.4

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

## [0.3.6] - 2021-07-28

## Fixed

- Escaped `<`, `>`, and `&` characters in HTML text content are now preserved
  when generating runtime & transform mode output. Previously they sometimes
  were emitted unescaped, generating invalid markup.

## [0.3.5] - 2021-07-14

## Added

- Added `configureSsrLocalization` in `@lit/localize-tools/lib/ssr.js` which
  allows for safe concurrent rendering of localized templates with
  `@lit-labs/ssr` or other renderers using
  [`AsyncLocalStorage`](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage).

  ```ts
  import {configureSsrLocalization} from '@lit/localize-tools/lib/ssr.js';
  import {render} from '@lit-labs/ssr';
  import {html} from 'lit';

  const {withLocale} = await configureSsrLocalization({
    sourceLocale: 'en',
    targetLocales: ['es', 'nl'],
    loadLocale: (locale) => import(`./locales/${locale}.js`)),
  });

  const handleHttpRequest = (req, res) => {
    const locale = localeForRequest(req);
    withLocale(locale, async () => {
      // Any async work can happen in this function, and the request's locale
      // context will be safely preserved for every msg() call.
      await doSomeAsyncWork();
      for (const chunk of render(msg(html`Hello World`))) {
        res.write(chunk);
      }
      res.end();
    });
  };
  ```

## [0.3.4] - 2021-05-18

### Fixed

- Fix `Cannot find module '..../@lit/localize/internal/id-generation.js'` error
  by bumping `@lit/localize` dependency.

## [0.3.3] - 2021-05-18

### Fixed

- Fix bugs relating to expression values being substituted in duplicate or
  incorrect order in localized templates.

- Fix bug relating to `START_LIT_LOCALIZE_EXPR_` strings appearing inside
  localized templates.

## [0.3.2] - 2021-05-07

### Fixed

- Fixed missing `str` tag in generated translation templates.

## [0.3.1] - 2021-04-20

- Update dependencies.

## [0.3.0] - 2021-04-19

### Changed

- **[BREAKING]** Lit dependency upgraded to v2.

- **[BREAKING]** Replaces `Localized` mixin transform with `@localized`
  decorator and `updateWhenLocaleChanges` transforms.

## [0.2.1] - 2021-04-02

### Changed

- XLIFF file headers have been simplified to:

```xml
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
```

## [0.2.0] - 2021-03-30

### Changed

- **[BREAKING]** Description comments (`// msgdesc:`) have been removed in favor
  of the `desc` option.

Before:

```js
// msgdesc: Home page
class HomePage {
  hello() {
    // msgdesc: Greeting to Earth
    return msg(html`Hello World`);
  }
  goodbye() {
    // msgdesc: Farewell to Earth
    return msg(html`Goodbye World`);
  }
}
```

After:

```js
class HomePage {
  hello() {
    return msg(html`Hello World`, {
      desc: 'Home page / Greeting to Earth',
    });
  }
  goodbye() {
    return msg(html`Goodbye World`, {
      desc: 'Home page / Farewell to Earth',
    });
  }
}
```

## [0.1.1] - 2021-03-30

### Changed

- Bumped dependency versions for `xmldom` and `@lit/localize`

## [0.1.0] - 2021-03-24

### Changed

- Initial release of `@lit/localize-tools` package. This new package provides
  the `lit-localize` binary, while `@lit/localize` continues to provide the
  browser library (`msg`, `LocalizedElement`, etc.).

- **BREAKING** `lit-localize` now uses JS modules instead of CommonJS, so it
  requires Node 14 or higher.
