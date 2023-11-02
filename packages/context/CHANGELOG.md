# @lit-labs/context

## 1.0.1

### Patch Changes

- [#4329](https://github.com/lit/lit/pull/4329) [`df1980fe`](https://github.com/lit/lit/commit/df1980feaba3171be078ffce4b3c8c538758c599) - Remove dependency on `lit` package. All implementation code only uses `@lit/reactive-element`. `lit` is moved to dev dependencies as it is still used for tests.

- [#4286](https://github.com/lit/lit/pull/4286) [`1fb7a108`](https://github.com/lit/lit/commit/1fb7a108ef4d247517da31551fe34a91d3c6f8e7) - Fix erroneous description for the JSDoc on the `@provide()` decorator.

- [#4287](https://github.com/lit/lit/pull/4287) [`4edf9bc8`](https://github.com/lit/lit/commit/4edf9bc8b800f17aef48853cdd1893b33f656f4d) - Broaden the host type of context controllers and decorators to be compatible with Lit 2

## 1.0.0

### Major Changes

- [#4210](https://github.com/lit/lit/pull/4210) [`cf7d96d4`](https://github.com/lit/lit/commit/cf7d96d48c7a7d1f18d82b999a31f7d62d10d7b3) - Graduate @lit-labs/context to @lit/context, its permanent location. @lit-labs/context is now just a proxy for @lit/context, so code need not be duplicated in projects that depend on both.

## 1.0.0-pre.0

### Major Changes

- [#4210](https://github.com/lit/lit/pull/4210) [`cf7d96d4`](https://github.com/lit/lit/commit/cf7d96d48c7a7d1f18d82b999a31f7d62d10d7b3) - Graduate @lit-labs/context to @lit/context, its permanent location. @lit-labs/context is now just a proxy for @lit/context, so code need not be duplicated in projects that depend on both.

### Patch Changes

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit/reactive-element@2.0.0-pre.1
  - lit@3.0.0-pre.1

## Initial release!

@lit/context graduated from its previous location at @lit-labs/context.

For details on its changelog before graduating, see https://github.com/lit/lit/blob/main/packages/labs/context/CHANGELOG.md
