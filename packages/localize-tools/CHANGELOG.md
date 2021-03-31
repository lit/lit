# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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
