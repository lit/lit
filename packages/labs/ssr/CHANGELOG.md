# Change Log

## 3.1.9

### Patch Changes

- [#4311](https://github.com/lit/lit/pull/4311) [`cabe72a8`](https://github.com/lit/lit/commit/cabe72a863a5de14a4bbca384374db748dd9b4c5) - Update version range for `lit` dependency to include v2. This allows projects still on lit v2 to use this package without being forced to install lit v3.

- [#4314](https://github.com/lit/lit/pull/4314) [`f9c3659f`](https://github.com/lit/lit/commit/f9c3659f28ba2fc0bc6325ba569c2107ee0afb19) - Fix ModuleLoader so it can load modules concurrently.

- [#4298](https://github.com/lit/lit/pull/4298) [`c05767c2`](https://github.com/lit/lit/commit/c05767c2df70623cc379f1b0c86fcd0660f89e75) - Fix svg templates getting surrounded by empty `<svg></svg>` tags when rendered.

## 3.1.8

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#4202](https://github.com/lit/lit/pull/4202) [`77e9b48e`](https://github.com/lit/lit/commit/77e9b48e4aefc61d5fe31939019c281d7303137c) - Fix an obscure potential memory leak, only keeping weak references to directive classes.

- Updated dependencies:
  - @lit/reactive-element@2.0.0
  - lit-html@3.0.0
  - lit@3.0.0
  - lit-element@4.0.0

## 3.1.8-pre.0

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#4202](https://github.com/lit/lit/pull/4202) [`77e9b48e`](https://github.com/lit/lit/commit/77e9b48e4aefc61d5fe31939019c281d7303137c) - Fix an obscure potential memory leak, only keeping weak references to directive classes.

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit/reactive-element@2.0.0-pre.1
  - lit-element@4.0.0-pre.1
  - lit-html@3.0.0-pre.1
  - lit@3.0.0-pre.1

## 3.1.7

### Patch Changes

- [#4196](https://github.com/lit/lit/pull/4196) [`fb9147b0`](https://github.com/lit/lit/commit/fb9147b032d79997fc09f64cf364257bff73e940) Thanks [@robak86](https://github.com/robak86)! - Fix SSR returning a truncated response

## 3.1.6

### Patch Changes

- [#4188](https://github.com/lit/lit/pull/4188) [`4b1dc1b6`](https://github.com/lit/lit/commit/4b1dc1b66738ea976d30430532d4a963a78994cc) Thanks [@jimsimon](https://github.com/jimsimon)! - Improve "partIndex" error message to include the offending template, details about common causes, and a link to the docs.

- [#4175](https://github.com/lit/lit/pull/4175) [`84bb0523`](https://github.com/lit/lit/commit/84bb052335605581c88a2071d00b6c2598952122) Thanks [@43081j](https://github.com/43081j)! - Update parse5/tools to simplify importing of node types from the default tree adapter

- [#4168](https://github.com/lit/lit/pull/4168) [`444599eb`](https://github.com/lit/lit/commit/444599eb46d2fa0fa1b348921dfda317d860a327) Thanks [@43081j](https://github.com/43081j)! - Upgrade parse5 to 7.x in localize-tools and import from root of parse5 where possible

## 3.1.5

### Patch Changes

- [#3977](https://github.com/lit/lit/pull/3977) [`a2366a39`](https://github.com/lit/lit/commit/a2366a39635366dd252db4d4766867959ba03dff) - Make attribute handling case-insensitive for custom element rendering as it is in the browser for HTML elements.

## 3.1.4

### Patch Changes

- [#3942](https://github.com/lit/lit/pull/3942) [`ed42d5f0`](https://github.com/lit/lit/commit/ed42d5f07fc8eed344deaa2cd7b9a88ecdd68d54) - Fix adding node marker for hydration for nested custom elements without attributes. This ensures nested custom elements have their `defer-hydration` attribute removed when parent is hydrated even without any attributes or bindings.

## 3.1.3-pre.0

### Patch Changes

- [#3814](https://github.com/lit/lit/pull/3814) [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa) - Update to TypeScript v5.0

- Updated dependencies [[`be72f66b`](https://github.com/lit/lit/commit/be72f66bd9aab5d0586729fb5be4bac4aa27cb7f), [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654), [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2), [`76795a18`](https://github.com/lit/lit/commit/76795a18263bb5e762e9fc909c97d1fdacee5b1f), [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf), [`6f2833fd`](https://github.com/lit/lit/commit/6f2833fd05f2ecde5386f72d291dafc9dbae0cf7), [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe), [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020), [`7e8491d4`](https://github.com/lit/lit/commit/7e8491d4ed9f0c39d974616c4678552ef50b81df), [`23326c6b`](https://github.com/lit/lit/commit/23326c6b9a6abdf01998dadf5d0f20a643e457aa), [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4), [`76795a18`](https://github.com/lit/lit/commit/76795a18263bb5e762e9fc909c97d1fdacee5b1f)]:
  - @lit/reactive-element@2.0.0-pre.0
  - lit-html@3.0.0-pre.0
  - lit@3.0.0-pre.0
  - lit-element@4.0.0-pre.0
  - @lit-labs/ssr-dom-shim@1.1.2-pre.0
  - @lit-labs/ssr-client@1.1.2-pre.0

## 3.1.3

### Patch Changes

- [#3905](https://github.com/lit/lit/pull/3905) [`f8d72859`](https://github.com/lit/lit/commit/f8d7285976390bbb35c540eb7b516f3748064d19) - Handle non-array iterables including `map` directive in child parts

## 3.1.2

### Patch Changes

- [#3849](https://github.com/lit/lit/pull/3849) [`02d6a35a`](https://github.com/lit/lit/commit/02d6a35ab75285905b28a5b29e8a7740d3cb5e3f) - Add "module" to condition names to resolve for module loader

## 3.1.1

### Patch Changes

- [#3720](https://github.com/lit/lit/pull/3720) [`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7) - Use hydration modules from `@lit-labs/ssr-client`

- Updated dependencies [[`575fb578`](https://github.com/lit/lit/commit/575fb578473031859b59b9ed98634ba091b389f7)]:
  - @lit-labs/ssr-client@1.1.0

## 3.1.0

### Minor Changes

- [#3599](https://github.com/lit/lit/pull/3599) [`ca74ff6e`](https://github.com/lit/lit/commit/ca74ff6eda710b929ca7aaf759a98cdfa350cc0d) - Forwards compatibility for Declarative Shadow DOM's shadowrootmode rename

- [#3677](https://github.com/lit/lit/pull/3677) [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86) - Reflect ARIA attributes onto server rendered Lit elements with attached internals during SSR and remove them upon hydration.

- [#3667](https://github.com/lit/lit/pull/3667) [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f) - Improved how nodes with attribute/property/event/element bindings are rendered in SSR, to avoid adding comments inside of "raw text elements" like `<textarea>`. Fixes #3663.

  Note: `@lit-labs/ssr` and `lit-html` must be updated together.

### Patch Changes

- [#3712](https://github.com/lit/lit/pull/3712) [`f2eb9796`](https://github.com/lit/lit/commit/f2eb97962c7e77373b3b8861ab59639de22da3d0) - Fix a few things in the README

- [#3590](https://github.com/lit/lit/pull/3590) [`1d8a38ed`](https://github.com/lit/lit/commit/1d8a38ed0b962f23813a90c3c6423716c9271d83) - Make FallbackRenderer not emit a shadow root

- [#3584](https://github.com/lit/lit/pull/3584) [`61ec3dab`](https://github.com/lit/lit/commit/61ec3dab761e379c65f9e27946e53137da83fb58) - Remove `abstract` from members of the ElementRendererConstructor type

- Updated dependencies [[`4d698430`](https://github.com/lit/lit/commit/4d698430b38efa49c97b841238b331340af5fef0), [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`b95c86e5`](https://github.com/lit/lit/commit/b95c86e5ec0e2f6de63a23409b9ec489edb61b86), [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f), [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544)]:
  - lit-html@2.7.0
  - @lit-labs/ssr-dom-shim@1.1.0
  - lit@2.7.0
  - lit-element@3.3.0

## 3.0.1

### Patch Changes

- [#3432](https://github.com/lit/lit/pull/3432) [`805607fb`](https://github.com/lit/lit/commit/805607fb19535f5e2eaa2a27743ed6f1ff6fbb6d) - `LitElementRenderer` now uses `renderValue` from `lib/render-value.js`, removing a circular dependency.

## 3.0.0

### Major Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - ModuleLoader now provides a default VM global context object which provides basic globals that are available in both Node and browsers.

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - The SSR dom shim will now throw if a custom element is redefined.

- [#3431](https://github.com/lit/lit/pull/3431) [`ff637f52`](https://github.com/lit/lit/commit/ff637f52a3c2252e37d6ea6ae352c3c0f35a9e87) - The Lit SSR DOM shim no longer defines a global `window` variable. This was removed to improve compatibility with libraries that detect whether they are running in Node vs the browser by checking for the presence of `window`.

  If you have code that runs during SSR which depends on the presence of `window`, you can either replace `window` with `globalThis`, or use `isSsr` to avoid running that code on the server (see https://lit.dev/docs/ssr/authoring/#browser-only-code).

- [#3467](https://github.com/lit/lit/pull/3467) [`c77220e8`](https://github.com/lit/lit/commit/c77220e80bc5b04628776ef8e5828fcde5f8ad16) - Allow SSR renderers to produce asynchronous values. This is a BREAKING change.

  This changes the return type of `render()` and the `ElementRenderer` render methods to be a `RenderResult`, which is an iterable of strings or Promises and nested RenderResults.

  The iterable remains a sync iterable, not an async iterable. This is to support environments that require synchronous renders and because sync iterables are faster than async iterables. Since many server renders will not require async rendering, they should work in sync contexts and shouldn't pay the overhead of an async iterable.

  Including Promises in the sync iterable creates a kind of hybrid sync/async iteration protocol. Consumers of RenderResults must check each value to see if it is a Promise or iterable and wait or recurse as needed.

  This change introduces three new utilities to do this:

  - `collectResult(result: RenderResult): Promise<string>` - an async function that joins a RenderResult into a string. It waits for Promises and recurses into nested iterables.
  - `collectResultSync(result: RenderResult)` - a sync function that joins a RenderResult into a string. It recurses into nested iterables, but _throws_ when it encounters a Promise.
  - `RenderResultReadable` - a Node `Readable` stream implementation that provides values from a `RenderResult`. This can be piped into a `Writable` stream, or passed to web server frameworks like Koa.

### Minor Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - When running in Node, Lit now automatically includes minimal DOM shims which are
  sufficient for most SSR (Server Side Rendering) use-cases, removing the need to
  import the global DOM shim from `@lit-labs/ssr`.

  The new `@lit-labs/ssr-dom-shim` package has been introduced, which exports an `HTMLElement`, `CustomElementRegistry`, and default `customElements` singleton.

  The existing `@lit-labs/ssr` global DOM shim can still be used, and is compatible with the new package, because `@lit-labs/ssr` imports from `@lit-labs/ssr-dom-shim`. Importing the global DOM shim adds more APIs to the global object, such as a global `HTMLElement`, `TreeWalker`, `fetch`, and other APIs. It is recommended that users try to remove usage of the `@lit-labs/ssr` DOM shim, and instead rely on the more minimal, automatic shimming that `@lit/reactive-element` now provides automatically.

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - APIs such as attachShadow, setAttribute have been moved from the HTMLElement class shim to the Element class shim, matching the structure of the real API. This should have no effect in most cases, as HTMLElement inherits from Element.

### Patch Changes

- Updated dependencies [[`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8)]:
  - @lit-labs/ssr-dom-shim@1.0.0
  - @lit/reactive-element@1.6.0
  - lit-html@2.6.0
  - lit@2.6.0

## 2.3.0

### Minor Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - `ReactiveElement`'s `shadowRootOptions` are now used to configure declarative shadow roots' properties.

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Module resolution within SSR now supports package exports (via `package.json`)

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - Add support to SSR for loading of modules from packages with export maps

### Patch Changes

- Updated dependencies [[`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d)]:
  - lit-html@2.5.0
  - @lit/reactive-element@1.5.0
  - lit@2.5.0

## 2.2.3

### Patch Changes

- [#3187](https://github.com/lit/lit/pull/3187) [`84437af6`](https://github.com/lit/lit/commit/84437af6826a5cdb61c383c3034a0e4150e8e50f) - When using `renderModule`, `URL` and `URLSearchParams` are now available in global of the VM module context

- [#3204](https://github.com/lit/lit/pull/3204) [`19d7bd25`](https://github.com/lit/lit/commit/19d7bd255987cfeac2d8dfa9f9d04d2378568535) - Use `url` module to parse file URL to path for Windows compatibility

- Updated dependencies [[`daddeb34`](https://github.com/lit/lit/commit/daddeb346a2f454b25a6a5d1722683197f25fbcd), [`0725fdb4`](https://github.com/lit/lit/commit/0725fdb4dd7d36e3a7154830c41b9af4cf866e52), [`3766ae4c`](https://github.com/lit/lit/commit/3766ae4c35edf794aa30ee2d738c6f63fdda44e5), [`6361a4b4`](https://github.com/lit/lit/commit/6361a4b4a589465cf6836c8454ed8ca4521d7b4d), [`ae6f6808`](https://github.com/lit/lit/commit/ae6f6808f539254b72ec7efcff34b812173abe64)]:
  - lit-html@2.3.0
  - lit@2.3.0
  - @lit/reactive-element@1.4.0

## 2.2.2

### Patch Changes

- [#3138](https://github.com/lit/lit/pull/3138) [`6450e17b`](https://github.com/lit/lit/commit/6450e17b58d1000d0501ad2b427a3248564d0c29) - JS source maps now include the TS source inline

- [#3136](https://github.com/lit/lit/pull/3136) [`afff4c17`](https://github.com/lit/lit/commit/afff4c174f131b6461be1ac86e2ceb4201030a8a) - Upgrade node-fetch version

## 2.2.1

### Patch Changes

- [#3045](https://github.com/lit/lit/pull/3045) [`9a7b6546`](https://github.com/lit/lit/commit/9a7b6546c286a964cafb707812353f33c6f0113c) - Fix behavior of setAttribute when value is not a string to match browsers. It is now cast to a string. Fixes problems such as reflection of type:Number properties on ReactiveElements.

## 2.2.0

### Minor Changes

- [#2940](https://github.com/lit/lit/pull/2940) [`ac356997`](https://github.com/lit/lit/commit/ac356997351874706f8be235559c765861dce67d) - Add option to defer hydration of top level custom elements.

## 2.1.0

### Minor Changes

- [#2662](https://github.com/lit/lit/pull/2662) [`1d51ed8b`](https://github.com/lit/lit/commit/1d51ed8b7eb991e151759f9dbf8643b4ed781457) - Adds HTMLElement.shadowRoot property to dom-shim.

## 2.0.4

### Patch Changes

- [#2580](https://github.com/lit/lit/pull/2580) [`b8ceafb0`](https://github.com/lit/lit/commit/b8ceafb00651b9a4b5021ac5a3d1d960ceb10e6b) - Handle rendering of null and undefined element attribute values

## 2.0.3

### Patch Changes

- [#2510](https://github.com/lit/lit/pull/2510) [`937388e2`](https://github.com/lit/lit/commit/937388e247a26ee201f58be1c4fa536635b2fc5c) - Replace window proxy with reference to globalThis in global DOM shim

## 2.0.2

### Patch Changes

- [#2488](https://github.com/lit/lit/pull/2488) [`28d856e3`](https://github.com/lit/lit/commit/28d856e3d737bf0a9f7930d2349671efdd1c0bbb) - Fix typo in README import statements.

- [#2456](https://github.com/lit/lit/pull/2456) [`0b774e0e`](https://github.com/lit/lit/commit/0b774e0e9e8b42bf28ea6107ebd7062d3c0a36ab) - Fix TypeScript typing issues when using @lit-labs/ssr. Adds a dependency on @types/node for URL, which is part of the public ModuleLoader API. Adds a new VmModule interface for the ModuleLoader API, whose return type was previously completely missing.

- [#2480](https://github.com/lit/lit/pull/2480) [`c9022d53`](https://github.com/lit/lit/commit/c9022d53c62a372af5447f58cafbb2a7866b6d70) - Fix bug which could cause errors resolving lit modules with isolated vm modules.

- [#2406](https://github.com/lit/lit/pull/2406) [`5d77f893`](https://github.com/lit/lit/commit/5d77f893c6debb3fb09f2fb81b99ac2aadefe09c) - [@lit-labs/ssr] Fix typo in ssr readme. Fixes #2381

## 2.0.1

### Patch Changes

- [#2386](https://github.com/lit/lit/pull/2386) [`734d8890`](https://github.com/lit/lit/commit/734d88909eb285d935cb583c016242d634fa2c75) - Unpin SSR's dependency on reactive-element

## 2.0.0

### Major Changes

- [#2288](https://github.com/lit/lit/pull/2288) [`b42f6f0f`](https://github.com/lit/lit/commit/b42f6f0f8b18e7efade96ce32a045374fe10530c) - Refactor the import-module into a class-based ModuleLoader API. Adds a module cache that tracks dependencies between modules.

### Minor Changes

- [#2294](https://github.com/lit/lit/pull/2294) [`dcab56b0`](https://github.com/lit/lit/commit/dcab56b0eeef6e05969c3682d3275a30ddf18d97) - Add customElementRendered callback to RenderInfo so that callers can know what elements were rendered.

### Patch Changes

- [#2346](https://github.com/lit/lit/pull/2346) [`53e64286`](https://github.com/lit/lit/commit/53e642868d2f06429dfd9bb33e89e2baa3b45b64) - Remove dependency on escape-html (which is not an ES module)

* [#2344](https://github.com/lit/lit/pull/2344) [`bc46ddd6`](https://github.com/lit/lit/commit/bc46ddd669047e2ce592a680c14f09b7681132e3) - Fix bug where static attributes did not render for unknown elements

- [#2345](https://github.com/lit/lit/pull/2345) [`4edf4f3b`](https://github.com/lit/lit/commit/4edf4f3b93d41c24a79814c303abc7281449d44b) - Remove unnecessary dependencies: `koa`, `koa-node-resolve`, `koa-static`,
  `@webcomponents/template-shadowroot`

* [#2334](https://github.com/lit/lit/pull/2334) [`93d8751a`](https://github.com/lit/lit/commit/93d8751a28237521380ddd6b2a3c1294962ba84e) - add tests for reflected properties

* Updated dependencies [[`08e7fc56`](https://github.com/lit/lit/commit/08e7fc566894d1916dc768c0843fce962ca4d6d4), [`fcc2b3d0`](https://github.com/lit/lit/commit/fcc2b3d0054e69e6f76588ea9f440117b6d0deed), [`eb5c5d2b`](https://github.com/lit/lit/commit/eb5c5d2b2159dcd8b2321fa9a221b8d56d127a11), [`49ecf623`](https://github.com/lit/lit/commit/49ecf6239033e9578184d46116e6b89676d091db), [`26e3fb7b`](https://github.com/lit/lit/commit/26e3fb7ba1d3ef778a9862ff73374802b4b4eb2e), [`d319cf5f`](https://github.com/lit/lit/commit/d319cf5fde1c2b70185ee9a6252067ed0edaf2fc), [`1d563e83`](https://github.com/lit/lit/commit/1d563e830c02a2d1a22e1e939f1ace971b1d1ae7), [`221cb0a9`](https://github.com/lit/lit/commit/221cb0a90787631dcc867959de19febd2ebd3fd0)]:
  - @lit/reactive-element@1.1.0
  - lit@2.1.0
  - lit-html@2.1.0
  - lit-element@3.1.0

## 1.0.0

### Patch Changes

- [#2034](https://github.com/lit/lit/pull/2034) [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257) - Reverts the change in Lit 2 to pause ReactiveElement's update cycle while the element is disconnected. The update cycle for elements will now run while disconnected as in Lit 1, however AsyncDirectives must now check the `this.isConnected` flag during `update` to ensure that e.g. subscriptions that could lead to memory leaks are not made when AsyncDirectives update while disconnected.

* [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

- [#2141](https://github.com/lit/lit/pull/2141) [`d8ff5901`](https://github.com/lit/lit/commit/d8ff590120c2ac4830a1e4917a57a839c8011e39) - Add `LICENSE` files to public packages without one.

* [#2120](https://github.com/lit/lit/pull/2120) [`2043eb0f`](https://github.com/lit/lit/commit/2043eb0fc245f90620ec563aa7df90d7e3a2fa41) - Don't assign DOM shim window.global (and hence globalThis.global) to window

  This means that globalThis.global will retain its Node built-ins, whereas
  before it would lose anything we didn't explicitly set on window.

  Fixes https://github.com/lit/lit/issues/2118

- [#1881](https://github.com/lit/lit/pull/1881) [`a83f616`](https://github.com/lit/lit/commit/a83f616c493b745eb74f19db727731ae5a1f4e49) - Add demo for using global DOM shim instead of isolated VM contexts

* [#2077](https://github.com/lit/lit/pull/2077) [`88d8608f`](https://github.com/lit/lit/commit/88d8608fedb8817edea6ca106f3cf49ed5b896e1) - fixed import in README

- [#1972](https://github.com/lit/lit/pull/1972) [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4) - Properties that must remain unminified are now compatible with build tools other than rollup/terser.

- Updated dependencies [[`ff0d1556`](https://github.com/lit/lit/commit/ff0d15568fe79019ebfa6b72b88ba86aac4af91b), [`b3121ab7`](https://github.com/lit/lit/commit/b3121ab7ce71d6947d1081995e962806f32bc5ea), [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b), [`d6b385e3`](https://github.com/lit/lit/commit/d6b385e3e4ae2ff23c1ecc3164fa7bb1a20c7dd5), [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257), [`8189f094`](https://github.com/lit/lit/commit/8189f09406a5ee2f2c7351884486944fd46e1d5b), [`b4bd9f7c`](https://github.com/lit/lit/commit/b4bd9f7c7d036da8667cbd7075af4f6d6f27bc32), [`69389958`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`52a47c7e`](https://github.com/lit/lit/commit/52a47c7e25d71ff802083ca9b0751724efd3a4f4), [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047), [`08f60328`](https://github.com/lit/lit/commit/08f60328abf83113fe82c9d8ee43dc71f10a9b77), [`7adfbb0c`](https://github.com/lit/lit/commit/7adfbb0cd32a7eab82551aa6c9d1434e7c4b563e), [`d8ff5901`](https://github.com/lit/lit/commit/d8ff590120c2ac4830a1e4917a57a839c8011e39), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`24feb430`](https://github.com/lit/lit/commit/24feb4306ec3ddf2996c678a266a211b52f6aff2), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`0b4d6eda`](https://github.com/lit/lit/commit/0b4d6eda5220aeb53abe250217d70dcb8f45fe43), [`13d137e9`](https://github.com/lit/lit/commit/13d137e96456e8243fa5e3dbfbaf8d8e510016a7), [`f05be301`](https://github.com/lit/lit/commit/f05be301e36fce93ae887007c0bdd328e5434225), [`01353317`](https://github.com/lit/lit/commit/013533178ded7fb5e533e15f6dc982de25d12b94), [`a48f39c8`](https://github.com/lit/lit/commit/a48f39c8d5872dbc9a19a9bc72b22692950071f5), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705), [`724a9aab`](https://github.com/lit/lit/commit/724a9aabe263fb9dafee073e74de50a1aeabbe0f), [`0d703bfb`](https://github.com/lit/lit/commit/0d703bfbc9eb515a6bba8bf5ca608bbcd60fee98), [`56e8efd3`](https://github.com/lit/lit/commit/56e8efd3fc654396421e7024f82f0eac9d2c4d33), [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74), [`e5667d66`](https://github.com/lit/lit/commit/e5667d66f4da58e74206fdef526b1c21a6e45925), [`cc5c3a09`](https://github.com/lit/lit/commit/cc5c3a09a150bd19ce5445333dfb3799d33e03de), [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0), [`043a16fb`](https://github.com/lit/lit/commit/043a16fbfbd55c71fbee399691537765277694ea), [`761375ac`](https://github.com/lit/lit/commit/761375ac9ef28dd0ba8a1f9363aaf5f0df725205), [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4), [`5fabe2b5`](https://github.com/lit/lit/commit/5fabe2b5ae4ab8fba9dc2d23a69105d32e4c0705)]:
  - lit-html@2.0.0
  - @lit-labs/ssr-client@1.0.0
  - lit@2.0.0
  - lit-element@3.0.0

## 1.0.0-rc.3

### Patch Changes

- [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

* [#2120](https://github.com/lit/lit/pull/2120) [`2043eb0f`](https://github.com/lit/lit/commit/2043eb0fc245f90620ec563aa7df90d7e3a2fa41) - Don't assign DOM shim window.global (and hence globalThis.global) to window

  This means that globalThis.global will retain its Node built-ins, whereas
  before it would lose anything we didn't explicitly set on window.

  Fixes https://github.com/lit/lit/issues/2118

- [#2077](https://github.com/lit/lit/pull/2077) [`88d8608f`](https://github.com/lit/lit/commit/88d8608fedb8817edea6ca106f3cf49ed5b896e1) - fixed import in README

## 1.0.0-rc.2

### Patch Changes

- [#2034](https://github.com/lit/lit/pull/2034) [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257) - Reverts the change in Lit 2 to pause ReactiveElement's update cycle while the element is disconnected. The update cycle for elements will now run while disconnected as in Lit 1, however AsyncDirectives must now check the `this.isConnected` flag during `update` to ensure that e.g. subscriptions that could lead to memory leaks are not made when AsyncDirectives update while disconnected.

* [#1881](https://github.com/lit/lit/pull/1881) [`a83f616`](https://github.com/lit/lit/commit/a83f616c493b745eb74f19db727731ae5a1f4e49) - Add demo for using global DOM shim instead of isolated VM contexts

- [#1972](https://github.com/lit/lit/pull/1972) [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4) - Properties that must remain unminified are now compatible with build tools other than rollup/terser.

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

## 1.0.0-rc.1 - 2021-04-20

### Added

- Added `render-global` module for non-sandboxed rendering.

- Added `elementRenderers` option to `RenderInfo`, along with `static matchesClass()` method to `ElementRenderer`, allowing the default renderer(s) to be overridden.

- Added `defer-hydration` attribute handling, which helps coordinate ordered wakeup of custom elements during hydration.
