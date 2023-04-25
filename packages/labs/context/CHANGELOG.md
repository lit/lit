# @lit-labs/context

## 0.3.1-pre.0

### Patch Changes

- [#3834](https://github.com/lit/lit/pull/3834) [`9a4a1786`](https://github.com/lit/lit/commit/9a4a178618ba1a7c3e0e4eb603d5ca6c22ca58d7) - Fixes ContextRoot for requesters in nested shadowRoots, #3833

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`be72f66b`](https://github.com/lit/lit/commit/be72f66bd9aab5d0586729fb5be4bac4aa27cb7f), [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`343187b1`](https://github.com/lit/lit/commit/343187b1acbbdb02ce8d01fa0a0d326870419763), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7), [`4431cbb8`](https://github.com/lit/lit/commit/4431cbb85428e54bafa090088056a325fe623aa1), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4)]:
  - @lit/reactive-element@2.0.0-pre.0
  - lit@3.0.0-pre.0

## 0.3.0

### Minor Changes

- [#3632](https://github.com/lit/lit/pull/3632) [`2fa009f3`](https://github.com/lit/lit/commit/2fa009f327017bef9fdcedca4acac8820f33166a) - Add options object to ContextConsumer and ContextProvider constructors. Deprecate positional forms.

### Patch Changes

- [#3691](https://github.com/lit/lit/pull/3691) [`4fa03114`](https://github.com/lit/lit/commit/4fa031148bbf3954118e83df4106c711da35d186) - Work around a common bug in compilers that target ES5 when extending built in classes like Event.

- [#3628](https://github.com/lit/lit/pull/3628) [`61ce8148`](https://github.com/lit/lit/commit/61ce8148e3272a21a4cb009537c2db761b21a9df) - Add type parameter for key to createContext()

- [#3451](https://github.com/lit/lit/pull/3451) [`7c93499c`](https://github.com/lit/lit/commit/7c93499ccdfc493df9397163e552356e64bfd2c3) - Make ContextRoot deduplicate context requests by element and callback identity

- [#3698](https://github.com/lit/lit/pull/3698) [`b9c27c51`](https://github.com/lit/lit/commit/b9c27c5156ecdd752380c725fec17dab1f3fb704) - Explicitly annotate the this value of a set function. This makes some tooling happier.

- Updated dependencies [[`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f), [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544)]:
  - lit@2.7.0

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
