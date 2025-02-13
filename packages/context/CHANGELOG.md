# @lit-labs/context

## 1.1.4

### Patch Changes

- [#4734](https://github.com/lit/lit/pull/4734) [`0f535d48`](https://github.com/lit/lit/commit/0f535d483ba32c57e49ffaa7f7e4ce70a9f6f26d) Thanks [@sorin-davidoi](https://github.com/sorin-davidoi)! - Avoid calling Event.composedPath() when it is not needed

## 1.1.3

### Patch Changes

- [#4684](https://github.com/lit/lit/pull/4684) [`619449b8`](https://github.com/lit/lit/commit/619449b84cb63d9c00e4316551246957c939a64b) Thanks [@tomherni](https://github.com/tomherni)! - Fix syntax typo in code example in the Context README

## 1.1.2

### Patch Changes

- [#4598](https://github.com/lit/lit/pull/4598) [`7cfb2274`](https://github.com/lit/lit/commit/7cfb2274d8903c5be40ca4dcaf5167a57bb36a32) Thanks [@jun-sheaf](https://github.com/jun-sheaf)! - Use `target.set` instead of member assignment in `@consume()` decorator.

## 1.1.1

### Patch Changes

- [#4614](https://github.com/lit/lit/pull/4614) [`ab77cc9c`](https://github.com/lit/lit/commit/ab77cc9c83a67b60b42e77cf736fefbc6503f824) - Fix context types to be compatible with WCCG context protocol types.

## 1.1.0

### Minor Changes

- [#4371](https://github.com/lit/lit/pull/4371) [`62df19da`](https://github.com/lit/lit/commit/62df19da63b94b89e688277967b84b381dcf1660) Thanks [@autopulated](https://github.com/autopulated)! - `ContextProvider` can now be added to any HTML elements, not just custom elements implementing a `ReactiveControllerHost`.

### Patch Changes

- [#4373](https://github.com/lit/lit/pull/4373) [`22919f6d`](https://github.com/lit/lit/commit/22919f6d0051f075bdb5f6033a5e4263b76a0c3e) - Make property decorated with `@provide()` with TypeScript experimental decorators configurable. This allows chaining additional decorators that modify the property like `@property()` from `lit`.

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
