# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

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
