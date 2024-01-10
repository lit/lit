# @lit/localize

[npm-img]: https://img.shields.io/npm/v/@lit/localize
[npm-href]: https://www.npmjs.com/package/@lit/localize
[test-img]: https://github.com/lit/lit/workflows/Tests/badge.svg?branch=main
[test-href]: https://github.com/lit/lit/actions?query=workflow%3ATests+branch%3Amain+event%3Apush

[![Published on NPM][npm-img]][npm-href]
[![Test status][test-img]][test-href]

Lit Localize provides localization/internationalization support for Lit
templates. See [lit.dev](https://lit.dev/docs/localization/overview/) for full
documentation.

This is the repo for `@lit/localize`, the package provides the library that runs in
the browser and contains `msg` and other utilities.

See also
[`@lit/localize-tools`](https://github.com/lit/lit/tree/main/packages/localize-tools),
the package that provides the `lit-localize` command-line tool for extracting
messages and building localized apps.

## Installation

```sh
npm i @lit/localize
```

## Usage

```js
render() {
  return msg(html`Hello <b>World</b>`);
}
```

## Documentation

Full documentation is available on
[lit.dev](https://lit.dev/docs/localization/overview/).
