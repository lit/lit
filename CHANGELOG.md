# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Add optional `output.localeCodesModule` config file setting which generates a
  TypeScript module that exports `sourceLocale`, `targetLocales`, and
  `allLocales` using the locale codes from your config file. Use for keeping
  your config file and client config in sync.

## [0.3.0] - 2020-08-25

### Changed

- **[BREAKING]** The `msg` function has moved from the generated `localization.ts`
  module to the static `lit-localize` module. `localization.ts` is no longer
  generated, and all of its exports have been replaced by a substantially
  different API (see the README).

- **[BREAKING]** The initial locale is no longer automatically initialized from the
  `locale` URL parameter. Initializing/changing locales is now user-controlled.

- **[BREAKING]** The `tsOut` config file option is replaced by the new `output`
  object, with `mode: "runtime"|"transform"`.

### Added

- Add `transform` output mode, which emits an entire copy of the program in each
  locale, where all `msg` calls have been replaced with the raw translated
  template for that locale.

- Add `configureLocalization` function, which returns a `setLocale` and `getLocale`
  object.

- Add `lit-localize-status` event, which is dispatched to `window` whenever a
  locale change starts, completes, or fails.

- Add `Localized` mixin for `LitElement` components, which automatically
  re-renders whenever the locale changes in `runtime` mode.

### Fixed

- Fix incorrect JSON schema error about `targetLocales` field not being a
  `string[]`.

- Fix bug where `html` templates could not contain `<!-- comments -->`. HTML
  comments are now preserved as placeholders, similar to other HTML markup.

## [0.2.3] - 2020-05-13

- Fix missing `<xliff>` element in XLIFF output.
- Formatting change to XML output (e.g. fewer line breaks).

## [0.2.2] - 2020-05-13

- Fix incorrect path resolution when loading XLB files.
- Fix errors relating to prettier xml plugin resolution.

## [0.2.1] - 2020-05-13

- Add missing dependencies (`fs-extra`, `typescript`, `prettier`).

## [0.2.0] - 2020-05-13

- Add support for the XLIFF localization interchange format:
  https://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html

- [BREAKING] Replaced `xlbDir` config file property with `interchange` property.
  The interchange format is set with `interchange.format` (currently `xliff` or
  `xlb`), and other format-specific configuration is set in that object.

- Fix code generation bug where having more than one `targetLocale` would
  compile to invalid TypeScript (extra commas).

- Disable eslint warnings about camelcase for locale module imports like
  `zh_CN.ts`.

## [0.1.2] - 2020-05-09

- Add support for variables:

  ```typescript
  msg(
    'hello',
    (url: string, name: string) =>
      html`Hello ${name}, click <a href="${url}">here</a>!`,
    'World',
    'https://www.example.com/'
  );
  ```

## [0.1.1] - 2020-05-05

- Interpret paths as relative to the location of the config file, instead of
  relative to the current working directory.

- Move `@types` packages from `dependencies` to `devDependencies` if they aren't
  part of any API. In particular, this fixes an error where any package that depended
  on `lit-localize` would need to add `DOM` to their TypeScript `lib` settings for
  compatibility with `@types/xmldom`.

- Publish `.d.ts` files.

## [0.1.0] - 2020-05-05

- Initial release of `lit-localize`.
