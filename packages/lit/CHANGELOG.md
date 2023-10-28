# Change Log

## 3.0.1

### Patch Changes

- [#4240](https://github.com/lit/lit/pull/4240) [`edf998c9`](https://github.com/lit/lit/commit/edf998c9fe34183888ffc781dd330dc8a962dd7a) Thanks [@remziatay](https://github.com/remziatay)! - Improved the type inferece of the `choose()` directive to properly restrict the case type inferred from provided value. **Note**: If this change creates a type error in your code, there must have been an unreachable case that can be removed, or the type of your `value` might be missing a valid case in the union.

- [#4310](https://github.com/lit/lit/pull/4310) [`8f674ab3`](https://github.com/lit/lit/commit/8f674ab319e4eadbf5b028f1c0bd15d276c02d0e) Thanks [@megheaiulian](https://github.com/megheaiulian)! - The `when()` directive now calls the case functions with the provided condition value as an argument. This allows the narrowing of types for the condition value based on its truthiness when used as a parameter for the case function.

- [#4284](https://github.com/lit/lit/pull/4284) [`89a5b088`](https://github.com/lit/lit/commit/89a5b0882b3048e3e95a22eb739c649adc9de055) - Allow `null` to be in the type of `@query()` decorated fields

## 3.0.0

### Major Changes

- [#3756](https://github.com/lit/lit/pull/3756) [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4) - Drop IE11 support

- [#4146](https://github.com/lit/lit/pull/4146) [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad) - Generated accessor for reactive properties now wrap user accessors and automatically call `this.requestUpdate()` in the setter. As in previous versions, users can still specify `noAccessor: true`, in which case they should call `this.requestUpdate()` themselves in the setter if they want to trigger a reactive update.

- [#3765](https://github.com/lit/lit/pull/3765) [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020) - Remove experimental hydrate modules. These are available from `@lit-labs/ssr-client`.

- [#3850](https://github.com/lit/lit/pull/3850) [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df) - Delete deprecated queryAssignedNodes behavior and arguments.

  Migrate deprecated usage with a selector argument to use
  `@queryAssignedElements`. E.g.: `@queryAssignedNodes('list', true, '.item')` to
  `@queryAssignedElements({slot: '', flatten: false, selector: '.item'})`.

- [#4254](https://github.com/lit/lit/pull/4254) [`1040f758`](https://github.com/lit/lit/commit/1040f75861b029527538b4ec36b2cfedcc32988a) - Change the type of `ReactiveElement.renderRoot` and return type of `ReactiveElement.createRenderRoot()` to be `HTMLElement | DocumentFragment` to match each other and lit-html's `render()` method.

- [#3759](https://github.com/lit/lit/pull/3759) [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf) - Use replaceWith() for SVG templates

- [#3751](https://github.com/lit/lit/pull/3751) [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654) - Simplify lit-html attribute handling for standards-compliant browsers that iterate attributes in source order

- [#3750](https://github.com/lit/lit/pull/3750) [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe) - Use toggleAttribute() to simplify boolean attribute parts

- [#3896](https://github.com/lit/lit/pull/3896) [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5) - Warn on async overrides of performUpdate()

### Patch Changes

- [#4183](https://github.com/lit/lit/pull/4183) [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148) - Make the decorators work with the `accessor` keyword when `experimentalDecorators` is true.

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#3710](https://github.com/lit/lit/pull/3710) [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17) - Add `undefined` to the return type of PropertyValues.get()

- [#3762](https://github.com/lit/lit/pull/3762) [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2) - Remove Lit 1 -> Lit 2 migration warnings

- [#3918](https://github.com/lit/lit/pull/3918) [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b) - Some code golf on ReactiveElement

- [#3809](https://github.com/lit/lit/pull/3809) [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7) - Use for/of loops in more places

- Updated dependencies:
  - @lit/reactive-element@2.0.0
  - lit-html@3.0.0
  - lit-element@4.0.0

## 3.0.0-pre.1

### Major Changes

- [#4146](https://github.com/lit/lit/pull/4146) [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad) - Generated accessor for reactive properties now wrap user accessors and automatically call `this.requestUpdate()` in the setter. As in previous versions, users can still specify `noAccessor: true`, in which case they should call `this.requestUpdate()` themselves in the setter if they want to trigger a reactive update.

- [#3896](https://github.com/lit/lit/pull/3896) [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5) - Warn on async overrides of performUpdate()

### Minor Changes

- [#4081](https://github.com/lit/lit/pull/4081) [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417) - Sync from last stable release

- [#4183](https://github.com/lit/lit/pull/4183) [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148) - Make the decorators work with the `accessor` keyword when `experimentalDecorators` is true.

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#3918](https://github.com/lit/lit/pull/3918) [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b) - Some code golf on ReactiveElement

- [#3710](https://github.com/lit/lit/pull/3710) [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17) - Add `undefined` to the return type of PropertyValues.get()

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit/reactive-element@2.0.0-pre.1
  - lit-element@4.0.0-pre.1
  - lit-html@3.0.0-pre.1

## 3.0.0-pre.0

### Major Changes

- [#3751](https://github.com/lit/lit/pull/3751) [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654) - Simplify lit-html attribute handling for standards-compliant browsers that iterate attributes in source order

- [#3759](https://github.com/lit/lit/pull/3759) [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf) - Use replaceWith() for SVG templates

- [#3750](https://github.com/lit/lit/pull/3750) [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe) - Use toggleAttribute() to simplify boolean attribute parts

- [#3765](https://github.com/lit/lit/pull/3765) [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020) - Remove experimental hydrate modules. These are available from `@lit-labs/ssr-client`.

- [#3756](https://github.com/lit/lit/pull/3756) [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4) - Drop IE11 support

### Patch Changes

- [#3762](https://github.com/lit/lit/pull/3762) [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2) - Remove Lit 1 -> Lit 2 migration warnings

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`be72f66b`](https://github.com/lit/lit/commit/be72f66bd9aab5d0586729fb5be4bac4aa27cb7f), [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`76795a18`](https://github.com/lit/lit/commit/76795a18263bb5e762e9fc909c97d1fdacee5b1f), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4), [`76795a18`](https://github.com/lit/lit/commit/76795a18263bb5e762e9fc909c97d1fdacee5b1f)]:
  - @lit/reactive-element@2.0.0-pre.0
  - lit-html@3.0.0-pre.0
  - lit-element@4.0.0-pre.0

## 2.8.0

### Minor Changes

- [#3993](https://github.com/lit/lit/pull/3993) [`e2c50569`](https://github.com/lit/lit/commit/e2c50569c48849a9863e31dfd74a71bb4eb4524d) - Fix return type of `isTemplateResult` helper to include the `CompiledTemplateResult` and fix the `cache` directive to work correctly with `CompiledTemplateResult`s. Also add an explicit `isCompiledTemplateResult` helper.

### Patch Changes

- [#4031](https://github.com/lit/lit/pull/4031) [`8057c78d`](https://github.com/lit/lit/commit/8057c78def09e345e68c3fc009b8ab9d6cf1c0f2) - Rename ReactiveElement.\_initialize to \_\_initialize, make it private, and remove the @internal annotation. This will help prevent collisions with subclasses that implement their own \_initialize method, while using development builds.

- Updated dependencies [[`e2c50569`](https://github.com/lit/lit/commit/e2c50569c48849a9863e31dfd74a71bb4eb4524d)]:
  - lit-html@2.8.0

## 2.7.6

### Patch Changes

- [#3968](https://github.com/lit/lit/pull/3968) [`5bb40831`](https://github.com/lit/lit/commit/5bb408315f89b8855329074ad5d707880dc77923) - Allow undefined to be passed to the ref() directive

- [#3969](https://github.com/lit/lit/pull/3969) [`7d8d4a15`](https://github.com/lit/lit/commit/7d8d4a1517a10f51b7de442acd9354f6083e1518) - Make RefOrCallback generic like Ref<T>

- [#3987](https://github.com/lit/lit/pull/3987) [`bb2560f1`](https://github.com/lit/lit/commit/bb2560f15884c3decbedb5be6bab587150910668) - Change the `h` field of `CompiledTemplate`s to a `TemplateStringsArray` preventing the spoofing of `CompiledTemplate`s by JSON injection attacks. This should not be a breaking change for most users unless you're using CompiledTemplates. This is a necessary security fix, similar to [#2307](https://github.com/lit/lit/pull/2307).

## 2.7.5

### Patch Changes

- [#3917](https://github.com/lit/lit/pull/3917) [`f6387e35`](https://github.com/lit/lit/commit/f6387e3532194bafd4be9621ccb162fc7c4046ba) - Allow decorators to accept `ReactiveElement` class from a different source.

## 2.7.4

### Patch Changes

- [#3871](https://github.com/lit/lit/pull/3871) [`308280eb`](https://github.com/lit/lit/commit/308280eb1a1f66e07f651b72b050560ea3a01b84) - remove test directory from npm publication

## 2.7.3

### Patch Changes

- [#3825](https://github.com/lit/lit/pull/3825) [`343187b1`](https://github.com/lit/lit/commit/343187b1acbbdb02ce8d01fa0a0d326870419763) - `static-html` no longer adds an item to `TemplateResult`'s value array for the last consumed static value. This fixes an error with server-side rendering of static html.

- [#3766](https://github.com/lit/lit/pull/3766) [`4431cbb8`](https://github.com/lit/lit/commit/4431cbb85428e54bafa090088056a325fe623aa1) - Fix styleMap initial render of mixed-case custom props

## 2.7.2

### Patch Changes

- [#3788](https://github.com/lit/lit/pull/3788) [`88fe0390`](https://github.com/lit/lit/commit/88fe039015ff979e031efbdde1861ae5b11a0da5) - Allow numbers to be used as values in styleMap()

## 2.7.1

### Patch Changes

- [#3768](https://github.com/lit/lit/pull/3768) [`7c1191da`](https://github.com/lit/lit/commit/7c1191da8e2f33e145ea58265531b7c744835401) - Fix styleMap's handling of important flags

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - `lit-html/experimental-hydrate.js` and `lit-element/experimental-hydrate-support.js` have been moved to `@lit-labs/ssr-client`.

  The modules in the original location have been marked deprecated and will be removed in a future version.

## 2.7.0

### Minor Changes

- [#3677](https://github.com/lit/lit/pull/3677) [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86) - [SSR only] Reflect ARIA attributes onto server rendered Lit elements with attached internals during SSR and remove them upon hydration.

- [#3667](https://github.com/lit/lit/pull/3667) [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f) - [SSR only] Improved how nodes with attribute/property/event/element bindings are rendered in SSR, to avoid adding comments inside of "raw text elements" like `<textarea>`. Fixes #3663.

  Note: `@lit-labs/ssr` and `lit-html` must be updated together.

### Patch Changes

- [#3583](https://github.com/lit/lit/pull/3583) [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544) - [SSR only] Add more detail to some hydration errors

- Updated dependencies [[`4d698430`](https://github.com/lit/lit/commit/4d698430b38efa49c97b841238b331340af5fef0), [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f), [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544)]:
  - lit-html@2.7.0
  - lit-element@3.3.0

## 2.6.1

### Patch Changes

- [#3526](https://github.com/lit/lit/pull/3526) [`65e56655`](https://github.com/lit/lit/commit/65e56655b73d22172647c1a748e7a907ad0227c0) - Disable ShadyDOM noPatch in Node dev build. This fixes the issue of throwing due to undefined `window`.

- [#3561](https://github.com/lit/lit/pull/3561) [`e5c254e9`](https://github.com/lit/lit/commit/e5c254e96cb5d0f770ec616332e231559325c5c5) - Fix built-in shimming of `HTMLElement` for Node build of `reactive-element` to respect existing `HTMLElement` in global

## 2.6.0

### Minor Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - When running in Node, Lit now automatically includes minimal DOM shims which are
  sufficient for most SSR (Server Side Rendering) use-cases, removing the need to
  import the global DOM shim from `@lit-labs/ssr`.

  The new `@lit-labs/ssr-dom-shim` package has been introduced, which exports an `HTMLElement`, `CustomElementRegistry`, and default `customElements` singleton.

  The existing `@lit-labs/ssr` global DOM shim can still be used, and is compatible with the new package, because `@lit-labs/ssr` imports from `@lit-labs/ssr-dom-shim`. Importing the global DOM shim adds more APIs to the global object, such as a global `HTMLElement`, `TreeWalker`, `fetch`, and other APIs. It is recommended that users try to remove usage of the `@lit-labs/ssr` DOM shim, and instead rely on the more minimal, automatic shimming that `@lit/reactive-element` now provides automatically.

### Patch Changes

- Updated dependencies [[`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8)]:
  - @lit/reactive-element@1.6.0
  - lit-html@2.6.0

## 2.5.0

### Minor Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - `lit-html` and `reactive-element` now include development Node builds with unminified code and dev warnings.

### Patch Changes

- Updated dependencies [[`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d)]:
  - lit-html@2.5.0
  - @lit/reactive-element@1.5.0

## 2.4.1

### Patch Changes

- [#3374](https://github.com/lit/lit/pull/3374) [`bb098950`](https://github.com/lit/lit/commit/bb0989507f73f1e6d484199e3767eed39ebbaf22) - Initializers added to subclasses are no longer improperly added to superclass.

## 2.4.0

### Minor Changes

- [#3318](https://github.com/lit/lit/pull/3318) [`21313077`](https://github.com/lit/lit/commit/21313077669c19b3d631a50825b8a01dae1dd0d4) - Adds an `isServer` variable export to `lit` and `lit-html/is-server.js` which will be `true` in Node and `false` in the browser. This can be used when authoring components to change behavior based on whether or not the component is executing in an SSR context.

### Patch Changes

- [#3320](https://github.com/lit/lit/pull/3320) [`305852d4`](https://github.com/lit/lit/commit/305852d4a4f51174301720985de98fdbf8674648) - The `lit` package now specifies and "types" export condition allowing TypeScript `moduleResolution` to be `nodenext`.

- Updated dependencies [[`21313077`](https://github.com/lit/lit/commit/21313077669c19b3d631a50825b8a01dae1dd0d4)]:
  - lit-html@2.4.0

## 2.3.1

### Patch Changes

- [#3222](https://github.com/lit/lit/pull/3222) [`486739ec`](https://github.com/lit/lit/commit/486739ec23d70ef9ec93fb7249c2291181a8343b) - Fix `CSSStyleSheet is not defined` error that would occur when importing a Lit component in Node when both static `styles` and the `@property` decorator were used.

- [#3223](https://github.com/lit/lit/pull/3223) [`5a65ca97`](https://github.com/lit/lit/commit/5a65ca97464839fcd4ea59240b9910002fa64a82) - Use existing `document` in Node build

## 2.3.0

### Minor Changes

- [#3156](https://github.com/lit/lit/pull/3156) [`ae6f6808`](https://github.com/lit/lit/commit/ae6f6808f539254b72ec7efcff34b812173abe64) - Lit and its underlying libraries can now be imported directly from Node without crashing, without the need to load the @lit-labs/ssr dom-shim library. Note that actually rendering from a Node context still requires the @lit-labs/ssr dom-shim, and the appropriate integration between @lit-labs/ssr and your framework/tool.

### Patch Changes

- [#3003](https://github.com/lit/lit/pull/3003) [`daddeb34`](https://github.com/lit/lit/commit/daddeb346a2f454b25a6a5d1722683197f25fbcd) - Lit's `async-directive` now re-exports everything from the `directive` module.

- [#3120](https://github.com/lit/lit/pull/3120) [`6361a4b4`](https://github.com/lit/lit/commit/6361a4b4a589465cf6836c8454ed8ca4521d7b4d) - Bind `this` to custom attribute converter methods

- Updated dependencies [[`daddeb34`](https://github.com/lit/lit/commit/daddeb346a2f454b25a6a5d1722683197f25fbcd), [`0725fdb4`](https://github.com/lit/lit/commit/0725fdb4dd7d36e3a7154830c41b9af4cf866e52), [`3766ae4c`](https://github.com/lit/lit/commit/3766ae4c35edf794aa30ee2d738c6f63fdda44e5), [`6361a4b4`](https://github.com/lit/lit/commit/6361a4b4a589465cf6836c8454ed8ca4521d7b4d), [`ae6f6808`](https://github.com/lit/lit/commit/ae6f6808f539254b72ec7efcff34b812173abe64)]:
  - lit-html@2.3.0
  - @lit/reactive-element@1.4.0

## 2.2.8

### Patch Changes

- [#3130](https://github.com/lit/lit/pull/3130) [`1f0567f1`](https://github.com/lit/lit/commit/1f0567f10c56531e555329eeb006349ba022070f) - Export the underlying type of the `keyed` directive.

- [#3132](https://github.com/lit/lit/pull/3132) [`2fe2053f`](https://github.com/lit/lit/commit/2fe2053fe04e7226e5fa4e8b730e91a62a547b27) - Added "types" entry to package exports. This tells newer versions of TypeScript where to look for typings for each module.

## 2.2.7

### Patch Changes

- [#2978](https://github.com/lit/lit/pull/2978) [`634d4560`](https://github.com/lit/lit/commit/634d45601b1d13be6d21fce725ece6abb9b3ee71) - Changed the caching behavior of the css`` template literal tag so that same-text styles do not share a CSSStyleSheet. Note that this may be a breaking change in some very unusual scenarios on Chromium and Firefox > 101 only.

## 2.2.6

### Patch Changes

- [#2849](https://github.com/lit/lit/pull/2849) [`b12e8d93`](https://github.com/lit/lit/commit/b12e8d93fb4a45b1a16e37716ac6e0a684d5e220) - Expand documentation for `render` and `TemplateResult`.

## 2.2.5

### Patch Changes

- [#2952](https://github.com/lit/lit/pull/2952) [`a78cc3b7`](https://github.com/lit/lit/commit/a78cc3b7f221a97e04dfda77d790fbea8f48d12c) - Fix SSR hydration bug relating to <input> and other void elements having attribute bindings.

## 2.2.4

### Patch Changes

- [#2847](https://github.com/lit/lit/pull/2847) [`79d82385`](https://github.com/lit/lit/commit/79d823851fcf938a8b6a0ca5f164b6b6fb1b4155) - Fix typo in API docs for live() directive.

- [#2828](https://github.com/lit/lit/pull/2828) [`b3b6bc33`](https://github.com/lit/lit/commit/b3b6bc336910d73b5abad1c7da81731c110e74be) - Remove private Lit 2 migration helpers: `INTERNAL` and `clearContainerForLit2MigrationOnly`. This logic is no longer depended on.

## 2.2.3

### Patch Changes

- [#2732](https://github.com/lit/lit/pull/2732) [`3e181bcb`](https://github.com/lit/lit/commit/3e181bcb3d969775eda799fd6fcae1ead843225b) - Enforce use of file extensions in imports. Fixes an issue with older TypeScript compilers.

- [#2688](https://github.com/lit/lit/pull/2688) [`ef178ef6`](https://github.com/lit/lit/commit/ef178ef620c1deffecae391433e94bd64c72ac44) - Add explicit types to the jsdoc code samples for `query`, `queryAll`, and `queryAsync`.

## 2.2.2

### Patch Changes

- [#2657](https://github.com/lit/lit/pull/2657) [`a6069c40`](https://github.com/lit/lit/commit/a6069c40e78dff3adeffa7d2abe11c9c05503d22) - Remove readonly restriction from `StyleInfo` interface as addition, deletion, and updating of styles is valid. Expanded `styleMap` documentation with links to lit.dev.

- [#2642](https://github.com/lit/lit/pull/2642) [`badc532c`](https://github.com/lit/lit/commit/badc532c719f7ce42b7cf4fb9ff2d97f4615b021) - Add an additional security brand check to StaticValues; Similar to [#2307](https://github.com/lit/lit/pull/2307)

- [#2691](https://github.com/lit/lit/pull/2691) [`171143bd`](https://github.com/lit/lit/commit/171143bd52720ee4a65844e5ca14667dd0187f8e) - Fixes `ref` bug when auto-bound class method used as a callback could incorrectly receive `undefined`.

- [#2661](https://github.com/lit/lit/pull/2661) [`9a3a38cd`](https://github.com/lit/lit/commit/9a3a38cd7f7b9122c79cd0e220f7ce62130e53f6) - Give a clearer error message when rendering into null/undefined

- [#2646](https://github.com/lit/lit/pull/2646) [`365cd09a`](https://github.com/lit/lit/commit/365cd09a88a1c390045452aac82510c143ffe257) - Clarify that hacking around the template strings array brand error can create security vulnerabilities.

## 2.2.1

### Patch Changes

- [#2635](https://github.com/lit/lit/pull/2635) [`ae358703`](https://github.com/lit/lit/commit/ae3587038873ffcc4934fd008a0b45db4711561e) - Make the event debug logger lazier, doing even less work (with no side effects) even in dev mode unless the page has opted in.

## 2.2.0

### Minor Changes

- [#2401](https://github.com/lit/lit/pull/2401) [`2c9d0008`](https://github.com/lit/lit/commit/2c9d00082a416457ee02107013dd4925bf589628) - Added a devlog events system that may be used for debugging and visualizing Lit's internals.

### Patch Changes

- Updated dependencies [[`2c9d0008`](https://github.com/lit/lit/commit/2c9d00082a416457ee02107013dd4925bf589628)]:
  - lit-element@3.2.0
  - lit-html@2.2.0
  - @lit/reactive-element@1.3.0

## 2.1.4

### Patch Changes

- [#2518](https://github.com/lit/lit/pull/2518) [`bbbf21d4`](https://github.com/lit/lit/commit/bbbf21d4f7b22708d834098abb81a0743719a4df) - Fix breaking change in the PropertyValues type. Make PropertyValues<any> compatible with Map<string, string> and other Map types.

- [#2526](https://github.com/lit/lit/pull/2526) [`a50d188a`](https://github.com/lit/lit/commit/a50d188aac233bbd3f82bb17ce98abf1e60fc4cc) - Export PropertyValueMap such that JavaScript generated by Google Closure Compiler can reference this type. Do not directly import the `PropertyValueMap` interface.

## 2.1.3

### Patch Changes

- [#2498](https://github.com/lit/lit/pull/2498) [`2a1dc7a1`](https://github.com/lit/lit/commit/2a1dc7a1fd8faf501af3c4c401d822de3fbf2f9e) - Replace 'rare' with 'invalid' in svg tag function JSDocs.

- [#2459](https://github.com/lit/lit/pull/2459) [`23df9d45`](https://github.com/lit/lit/commit/23df9d4557d8c70820d76aec5c0fd3bce9106e3f) - Fix bindings inside of <title> elements

- [#2482](https://github.com/lit/lit/pull/2482) [`6ea3d6c4`](https://github.com/lit/lit/commit/6ea3d6c4b85664be96cdb5f5bd62c6e6263aeb28) - Update the definition of the PropertyValues type to give better types to `.get(k)`. `.get(k)` is now defined to return the correct type when using `PropertyValues<this>` and a parameter that's a key of the element class.

- [#2464](https://github.com/lit/lit/pull/2464) [`df4e1a46`](https://github.com/lit/lit/commit/df4e1a46751ec6f6f75ae378aff4b693ba4d3a9d) - Fix type signature in queryAssignedNodes JSDoc code example.

- [#2479](https://github.com/lit/lit/pull/2479) [`89560520`](https://github.com/lit/lit/commit/89560520f08079dc1b0e91f1096934d9ccabed59) - Expand JSDocs for the `svg` tagged template literal (TTL). The new documentation makes it more clear that the `svg` tag function should only be used for SVG fragments, and not for the `<svg>` HTML element.

- [#2457](https://github.com/lit/lit/pull/2457) [`48d69184`](https://github.com/lit/lit/commit/48d69184e6b975f2c707214d7cf5934e5dcc2cf0) - Add JSDoc to the `willUpdate` lifecycle callback. Expand the docs for `firstUpdated`, and `attributeChangedCallback`. Minor code sample fixes.

## 2.1.2

### Patch Changes

- [#2399](https://github.com/lit/lit/pull/2399) [`5ac025bf`](https://github.com/lit/lit/commit/5ac025bf9610adb7069ef8d88ed6bd96ff730f2f) - Correct typo in `async-directive` module comment

- [#2370](https://github.com/lit/lit/pull/2370) [`7453e365`](https://github.com/lit/lit/commit/7453e365000e6a289c139cf7e175a4742296333d) - Replace square bracket links with the `linkcode` JSDoc tag.
  Editors will create a jump to definition hyperlink for the linkcode tag if the identifier is in scope.

- [#2410](https://github.com/lit/lit/pull/2410) [`b9a6962b`](https://github.com/lit/lit/commit/b9a6962b84c841eaabd5c4cbf8687ff34dbfe511) - Correct the link path of CONTRIBUTING.md in README.md files

## 2.1.1

### Patch Changes

- [#2384](https://github.com/lit/lit/pull/2384) [`39b8db85`](https://github.com/lit/lit/commit/39b8db85ef8d2264a86ff6ff6559ea06b391f08f) - Fix missing decorators/query-assigned-elements.js file

* [#2380](https://github.com/lit/lit/pull/2380) [`00cd8533`](https://github.com/lit/lit/commit/00cd85337e0a4177730e2d0eba60b5e3ea37f6c6) - Fix choose directive default export path.

## 2.1.0

### Minor Changes

- [#2337](https://github.com/lit/lit/pull/2337) [`fcc2b3d0`](https://github.com/lit/lit/commit/fcc2b3d0054e69e6f76588ea9f440117b6d0deed) - Add a `keyed(key, value)` directive that clears a part if the key changes.

* [#2327](https://github.com/lit/lit/pull/2327) [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db) - Add `queryAssignedElements` decorator for a declarative API that calls `HTMLSlotElement.assignedElements()` on a specified slot. `selector` option allows filtering returned elements with a CSS selector.

- [#2341](https://github.com/lit/lit/pull/2341) [`1d563e83`](https://github.com/lit/lit/commit/1d563e830c02a2d1a22e1e939f1ace971b1d1ae7) - Add choose() directive

### Patch Changes

- Updated dependencies [[`08e7fc56`](https://github.com/lit/lit/commit/08e7fc566894d1916dc768c0843fce962ca4d6d4), [`fcc2b3d0`](https://github.com/lit/lit/commit/fcc2b3d0054e69e6f76588ea9f440117b6d0deed), [`eb5c5d2b`](https://github.com/lit/lit/commit/eb5c5d2b2159dcd8b2321fa9a221b8d56d127a11), [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db), [`26e3fb7b`](https://github.com/lit/lit/commit/26e3fb7ba1d3ef778a9862ff73374802b4b4eb2e), [`d319cf5f`](https://github.com/lit/lit/commit/d319cf5fde1c2b70185ee9a6252067ed0edaf2fc), [`1d563e83`](https://github.com/lit/lit/commit/1d563e830c02a2d1a22e1e939f1ace971b1d1ae7), [`221cb0a9`](https://github.com/lit/lit/commit/221cb0a90787631dcc867959de19febd2ebd3fd0)]:
  - @lit/reactive-element@1.1.0
  - lit-html@2.1.0
  - lit-element@3.1.0

## 2.0.2

### Patch Changes

- [#2234](https://github.com/lit/lit/pull/2234) [`de17a7d4`](https://github.com/lit/lit/commit/de17a7d4e4c5a60410400dbb24ddf2b3c09dd41b) - Fix repository.directory field in lit package.json

## 2.0.1

### Patch Changes

- [#2232](https://github.com/lit/lit/pull/2232) [`d808d234`](https://github.com/lit/lit/commit/d808d234a56844509a766c68492f6f588738ca7e) - Add lit logo to NPM package

## 2.0.0

### Major Changes

- New package serving as the main entry point for all users of Lit (including `LitElement`, `ReactiveElement`, and `lit-html`). See the [Migration Guide](https://lit.dev/docs/releases/upgrade/#update-packages-and-import-paths) for more details.

## 2.0.0-rc.4

### Patch Changes

- [#2103](https://github.com/lit/lit/pull/2103) [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b) - Updates the `exports` field of `package.json` files to replace the [subpath
  folder
  mapping](https://nodejs.org/dist/latest-v16.x/docs/api/packages.html#packages_subpath_folder_mappings)
  syntax with an explicit list of all exported files.

  The `/`-suffixed syntax for subpath folder mapping originally used in these
  files is deprecated. Rather than update to the new syntax, this change replaces
  these mappings with individual entries for all exported files so that (a) users
  must import using extensions and (b) bundlers or other tools that don't resolve
  subpath folder mapping exactly as Node.js does won't break these packages'
  expectations around how they're imported.

* [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

- [#2073](https://github.com/lit/lit/pull/2073) [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74) - (Cleanup) Removed obsolete TODOs from codebase

## 2.0.0-rc.3

### Patch Changes

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#1959](https://github.com/lit/lit/pull/1959) [`6938995`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302) - Changed prefix used for minifying class field names on lit libraries to stay within ASCII subset, to avoid needing to explicitly set the charset for scripts in some browsers.

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

- Updated dependencies [[`ff0d1556`](https://github.com/lit/lit/commit/ff0d15568fe79019ebfa6b72b88ba86aac4af91b), [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257), [`69389958`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`52a47c7e`](https://github.com/lit/lit/commit/52a47c7e25d71ff802083ca9b0751724efd3a4f4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`f05be301`](https://github.com/lit/lit/commit/f05be301e36fce93ae887007c0bdd328e5434225), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`56e8efd3`](https://github.com/lit/lit/commit/56e8efd3fc654396421e7024f82f0eac9d2c4d33), [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0), [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - lit-html@2.0.0-rc.4

---

Changes below were based on the [Keep a Changelog](http://keepachangelog.com/) format. All changes above are generated automatically by [Changesets](https://github.com/atlassian/changesets).

---

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [x.y.z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Removed -->
<!-- ### Fixed -->

## [2.0.0-rc.2] - 2021-05-07

### Changed

- Updated dependencies

## [2.0.0-rc.1] - 2021-04-20

### Changed

- (Since 2.0.0-pre.1) Renamed `hydrate` and `hydrate-support` modules to `experimental-hydrate` and `experimental-hydrate-support`, respectively, to reflect their experimental nature. Experimental modules may undergo breaking changes within otherwise non-major releases.

## [2.0.0-pre.2] - 2021-03-31

### Changed

- Updated dependencies

## [2.0.0-pre.1] - 2021-02-11

Initial release
