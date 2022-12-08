# @lit-labs/context

## 0.2.0

### Minor Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Rename ContextKey to Context

### Patch Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Make @consume decorator work with optional fields

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Allow ContextProvider to be added lazily and still work with ContextRoot

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Rename @contextProvided and @contextProvider to @consume and @provide

- Updated dependencies [[`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d)]:
  - @lit/reactive-element@1.5.0
  - lit@2.5.0

## 0.1.3

### Patch Changes

- [#3132](https://github.com/lit/lit/pull/3132) [`2fe2053f`](https://github.com/lit/lit/commit/2fe2053fe04e7226e5fa4e8b730e91a62a547b27) - Added "types" entry to package exports. This tells newer versions of TypeScript where to look for typings for each module.

## 0.1.2

### Patch Changes

- [#2979](https://github.com/lit/lit/pull/2979) [`09156025`](https://github.com/lit/lit/commit/0915602543cd211be19ffd2f54e0082df7ac5ea4) - Fixes `@contextProvider` when multiple instances of an element are created; updates docs to consistently reference `@contextProvided`.

- [#2858](https://github.com/lit/lit/pull/2858) [`5b4edbb6`](https://github.com/lit/lit/commit/5b4edbb6b602f3c40034ebe629b94b2e51ac0c1e) - An element can now provide and request the same context. This lets elements
  redefine the context binding in terms of what was provided by the parent.

## 0.1.1

### Patch Changes

- [#2824](https://github.com/lit/lit/pull/2824) [`7984d373`](https://github.com/lit/lit/commit/7984d373f2932453cc7a5478c4569b73e47e6d2c) - lower target js version

- [#2813](https://github.com/lit/lit/pull/2813) [`aca58db7`](https://github.com/lit/lit/commit/aca58db7bfd71debcf9b5b3b62ff273a574ddf91) - Fixes files list for package to include lib files.

## 0.1.0

### Minor Changes

- [#1955](https://github.com/lit/lit/pull/1955) [`be0119f6`](https://github.com/lit/lit/commit/be0119f6e130b4af9a17be36b0d8ba220a35b5a0) - Initial release
