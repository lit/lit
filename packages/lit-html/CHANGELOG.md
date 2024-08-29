# Change Log

## 3.2.0

### Minor Changes

- [#4637](https://github.com/lit/lit/pull/4637) [`feccc1ba`](https://github.com/lit/lit/commit/feccc1ba8e82b36d07a0e2576381bf2819926b98) - Add MathML support with the `mathml` template tag

## 3.1.4

### Patch Changes

- [#4646](https://github.com/lit/lit/pull/4646) [`abf30b3e`](https://github.com/lit/lit/commit/abf30b3e895ea5d833f6d9559612e2b1ba47580d) - The value provided by the `ref()` directive will always be `undefined` when the element is disconnected.

## 3.1.3

### Patch Changes

- [#4570](https://github.com/lit/lit/pull/4570) [`bd881370`](https://github.com/lit/lit/commit/bd881370b83d366f7654dd510731242a68949a20) - Fix the lit-html marker length to be consistently 9 characters.

## 3.1.2

### Patch Changes

- [#4523](https://github.com/lit/lit/pull/4523) [`1a32b61e`](https://github.com/lit/lit/commit/1a32b61ecf09c2c2e6efac2735c2c627af793286) - Add a DEV_MODE error to catch duplicate attribute bindings that otherwise create silent errors.

- [#4485](https://github.com/lit/lit/pull/4485) [`57b00630`](https://github.com/lit/lit/commit/57b006306c269bd835979935dae3062599c4fccf) - Add "browser" export condition entrypoints to any package.json files with "node"
  export conditions. This fixes Node test runners emulating browser environments that were incorrectly loading the
  "node" entrypoints instead of the browser code.

- [#4515](https://github.com/lit/lit/pull/4515) [`dca963f7`](https://github.com/lit/lit/commit/dca963f7f5d2f7be91f2f073ebabe92d033b3a25) - Fix a memory leak when patching directive constructors for SSR.

## 3.1.1

### Patch Changes

- [#4409](https://github.com/lit/lit/pull/4409) [`1af7991c`](https://github.com/lit/lit/commit/1af7991c27456c7e6073a3ee6f18f102c2adc026) - asyncReplace correctly re-renders when value is unchanged (#4408)

## 3.1.0

### Minor Changes

- [#4309](https://github.com/lit/lit/pull/4309) [`949a5467`](https://github.com/lit/lit/commit/949a54677748a1f83ec4d166bd40e244de3afda7) - Adds two new types: UncompiledTemplateResult and MaybeCompiledTemplateResult. Currently UncompiledTemplateResult is the same as TemplateResult, and MaybeCompiledTemplateResult is the union of the compiled and uncompiled types.

## 3.0.2

### Patch Changes

- [#4345](https://github.com/lit/lit/pull/4345) [`02b8d620`](https://github.com/lit/lit/commit/02b8d62003a16075ce3873ac3e40db43c0254ecf) - Add a dev mode warning if a static value such as `literal` or `unsafeStatic` is detected within the non-static `html` tag function. These should only be used with the static `html` tag function imported from `lit-html/static.js` or `lit/static-html.js`.

## 3.0.1

### Patch Changes

- [#4240](https://github.com/lit/lit/pull/4240) [`edf998c9`](https://github.com/lit/lit/commit/edf998c9fe34183888ffc781dd330dc8a962dd7a) Thanks [@remziatay](https://github.com/remziatay)! - Improved the type inferece of the `choose()` directive to properly restrict the case type inferred from provided value. **Note**: If this change creates a type error in your code, there must have been an unreachable case that can be removed, or the type of your `value` might be missing a valid case in the union.

- [#4310](https://github.com/lit/lit/pull/4310) [`8f674ab3`](https://github.com/lit/lit/commit/8f674ab319e4eadbf5b028f1c0bd15d276c02d0e) Thanks [@megheaiulian](https://github.com/megheaiulian)! - The `when()` directive now calls the case functions with the provided condition value as an argument. This allows the narrowing of types for the condition value based on its truthiness when used as a parameter for the case function.

## 3.0.0

### Major Changes

- [#3756](https://github.com/lit/lit/pull/3756) [`f06f7972`](https://github.com/lit/lit/commit/f06f7972a027d2937fe2c68ab5af0274dec57cf4) - Drop IE11 support

- [#3759](https://github.com/lit/lit/pull/3759) [`1db01376`](https://github.com/lit/lit/commit/1db0137699b35d7e7bfac9b2ab274af4100fd7cf) - Use replaceWith() for SVG templates

- [#3765](https://github.com/lit/lit/pull/3765) [`92cedaa2`](https://github.com/lit/lit/commit/92cedaa2c8cd8a306be3fe25d52e0e47bb044020) - Remove experimental hydrate modules. These are available from `@lit-labs/ssr-client`.

- [#3751](https://github.com/lit/lit/pull/3751) [`dfd747cf`](https://github.com/lit/lit/commit/dfd747cf4f7239e0c3bb7134f8acb967d0157654) - Simplify lit-html attribute handling for standards-compliant browsers that iterate attributes in source order

- [#3750](https://github.com/lit/lit/pull/3750) [`c3e473b4`](https://github.com/lit/lit/commit/c3e473b499ff029b5e1aff01ca8799daf1ca1bbe) - Use toggleAttribute() to simplify boolean attribute parts

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

- [#3762](https://github.com/lit/lit/pull/3762) [`23c404fd`](https://github.com/lit/lit/commit/23c404fdec0cd7be834221b6ddf9b659c24ca8a2) - Remove Lit 1 -> Lit 2 migration warnings

## 3.0.0-pre.1

### Minor Changes

- [#4081](https://github.com/lit/lit/pull/4081) [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417) - Sync from last stable release

### Patch Changes

- [#4141](https://github.com/lit/lit/pull/4141) [`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5) - Update TypeScript to ~5.2.0

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

## 2.8.0

### Minor Changes

- [#3993](https://github.com/lit/lit/pull/3993) [`e2c50569`](https://github.com/lit/lit/commit/e2c50569c48849a9863e31dfd74a71bb4eb4524d) - Fix return type of `isTemplateResult` helper to include the `CompiledTemplateResult` and fix the `cache` directive to work correctly with `CompiledTemplateResult`s. Also add an explicit `isCompiledTemplateResult` helper.

## 2.7.5

### Patch Changes

- [#3968](https://github.com/lit/lit/pull/3968) [`5bb40831`](https://github.com/lit/lit/commit/5bb408315f89b8855329074ad5d707880dc77923) - Allow undefined to be passed to the ref() directive

- [#3969](https://github.com/lit/lit/pull/3969) [`7d8d4a15`](https://github.com/lit/lit/commit/7d8d4a1517a10f51b7de442acd9354f6083e1518) - Make RefOrCallback generic like Ref<T>

- [#3987](https://github.com/lit/lit/pull/3987) [`bb2560f1`](https://github.com/lit/lit/commit/bb2560f15884c3decbedb5be6bab587150910668) - Change the `h` field of `CompiledTemplate`s to a `TemplateStringsArray` preventing the spoofing of `CompiledTemplate`s by JSON injection attacks. This should not be a breaking change for most users unless you're using CompiledTemplates. This is a necessary security fix, similar to [#2307](https://github.com/lit/lit/pull/2307).

## 2.7.4

### Patch Changes

- [#3888](https://github.com/lit/lit/pull/3888) [`0f30e6fb`](https://github.com/lit/lit/commit/0f30e6fbcc1aba2649e7670ac9c03544f4932b6d) - Fix a memory leak cause by lit-html's shared TreeWalker holding a reference to the last tree it walked.

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

- [#3667](https://github.com/lit/lit/pull/3667) [`e00f6f52`](https://github.com/lit/lit/commit/e00f6f52199d5dbc08d4c15f62380422e77cde7f) - [SSR only] Improved how nodes with attribute/property/event/element bindings are rendered in SSR, to avoid adding comments inside of "raw text elements" like `<textarea>`. Fixes #3663.

  Note: `@lit-labs/ssr` and `lit-html` must be updated together.

### Patch Changes

- [#3615](https://github.com/lit/lit/pull/3615) [`4d698430`](https://github.com/lit/lit/commit/4d698430b38efa49c97b841238b331340af5fef0) - Don't throw in `ChildPart.parentNode` if the `parentNode` is null

- [#3583](https://github.com/lit/lit/pull/3583) [`88a40177`](https://github.com/lit/lit/commit/88a40177de9be5d117a21e3da5414bd777872544) - [SSR only] Add more detail to some hydration errors

## 2.6.1

### Patch Changes

- [#3526](https://github.com/lit/lit/pull/3526) [`65e56655`](https://github.com/lit/lit/commit/65e56655b73d22172647c1a748e7a907ad0227c0) - Disable ShadyDOM noPatch in Node dev build. This fixes the issue of throwing due to undefined `window`.

## 2.6.0

### Minor Changes

- [#3522](https://github.com/lit/lit/pull/3522) [`72fcf0d7`](https://github.com/lit/lit/commit/72fcf0d70b4f4644e080e9c375a58cf8fc35e9e8) - When running in Node, Lit now automatically includes minimal DOM shims which are
  sufficient for most SSR (Server Side Rendering) use-cases, removing the need to
  import the global DOM shim from `@lit-labs/ssr`.

  The new `@lit-labs/ssr-dom-shim` package has been introduced, which exports an `HTMLElement`, `CustomElementRegistry`, and default `customElements` singleton.

  The existing `@lit-labs/ssr` global DOM shim can still be used, and is compatible with the new package, because `@lit-labs/ssr` imports from `@lit-labs/ssr-dom-shim`. Importing the global DOM shim adds more APIs to the global object, such as a global `HTMLElement`, `TreeWalker`, `fetch`, and other APIs. It is recommended that users try to remove usage of the `@lit-labs/ssr` DOM shim, and instead rely on the more minimal, automatic shimming that `@lit/reactive-element` now provides automatically.

## 2.5.0

### Minor Changes

- [#3507](https://github.com/lit/lit/pull/3507) [`b152db29`](https://github.com/lit/lit/commit/b152db291932aa25356543395251a9b42e12292d) - `lit-html` and `reactive-element` now include development Node builds with unminified code and dev warnings.

## 2.4.0

### Minor Changes

- [#3318](https://github.com/lit/lit/pull/3318) [`21313077`](https://github.com/lit/lit/commit/21313077669c19b3d631a50825b8a01dae1dd0d4) - Adds an `isServer` variable export to `lit` and `lit-html/is-server.js` which will be `true` in Node and `false` in the browser. This can be used when authoring components to change behavior based on whether or not the component is executing in an SSR context.

## 2.3.1

### Patch Changes

- [#3223](https://github.com/lit/lit/pull/3223) [`5a65ca97`](https://github.com/lit/lit/commit/5a65ca97464839fcd4ea59240b9910002fa64a82) - Use existing `document` in Node build

## 2.3.0

### Minor Changes

- [#3156](https://github.com/lit/lit/pull/3156) [`ae6f6808`](https://github.com/lit/lit/commit/ae6f6808f539254b72ec7efcff34b812173abe64) - Lit and its underlying libraries can now be imported directly from Node without crashing, without the need to load the @lit-labs/ssr dom-shim library. Note that actually rendering from a Node context still requires the @lit-labs/ssr dom-shim, and the appropriate integration between @lit-labs/ssr and your framework/tool.

### Patch Changes

- [#3003](https://github.com/lit/lit/pull/3003) [`daddeb34`](https://github.com/lit/lit/commit/daddeb346a2f454b25a6a5d1722683197f25fbcd) - Lit's `async-directive` now re-exports everything from the `directive` module.

- [#3199](https://github.com/lit/lit/pull/3199) [`0725fdb4`](https://github.com/lit/lit/commit/0725fdb4dd7d36e3a7154830c41b9af4cf866e52) - In DEV_MODE, render a warning instead of rendering a template's host in the template.

  Most commonly this would happen when rendering `${this}` in a LitElement's template, which has the counterintuitive behavior of removing the element from the DOM, because when rendering the element's template we attach it into its own shadow root, which removes it from the DOM, causing it simply disappear. This is especially problematic with a fast HMR system.

- [#3186](https://github.com/lit/lit/pull/3186) [`3766ae4c`](https://github.com/lit/lit/commit/3766ae4c35edf794aa30ee2d738c6f63fdda44e5) - `StaticValue` interface type is now exported.

## 2.2.7

### Patch Changes

- [#3130](https://github.com/lit/lit/pull/3130) [`1f0567f1`](https://github.com/lit/lit/commit/1f0567f10c56531e555329eeb006349ba022070f) - Export the underlying type of the `keyed` directive.

- [#3132](https://github.com/lit/lit/pull/3132) [`2fe2053f`](https://github.com/lit/lit/commit/2fe2053fe04e7226e5fa4e8b730e91a62a547b27) - Added "types" entry to package exports. This tells newer versions of TypeScript where to look for typings for each module.

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

## 2.1.3

### Patch Changes

- [#2498](https://github.com/lit/lit/pull/2498) [`2a1dc7a1`](https://github.com/lit/lit/commit/2a1dc7a1fd8faf501af3c4c401d822de3fbf2f9e) - Replace 'rare' with 'invalid' in svg tag function JSDocs.

- [#2459](https://github.com/lit/lit/pull/2459) [`23df9d45`](https://github.com/lit/lit/commit/23df9d4557d8c70820d76aec5c0fd3bce9106e3f) - Fix bindings inside of <title> elements

- [#2479](https://github.com/lit/lit/pull/2479) [`89560520`](https://github.com/lit/lit/commit/89560520f08079dc1b0e91f1096934d9ccabed59) - Expand JSDocs for the `svg` tagged template literal (TTL). The new documentation makes it more clear that the `svg` tag function should only be used for SVG fragments, and not for the `<svg>` HTML element.

## 2.1.2

### Patch Changes

- [#2399](https://github.com/lit/lit/pull/2399) [`5ac025bf`](https://github.com/lit/lit/commit/5ac025bf9610adb7069ef8d88ed6bd96ff730f2f) - Correct typo in `async-directive` module comment

- [#2410](https://github.com/lit/lit/pull/2410) [`b9a6962b`](https://github.com/lit/lit/commit/b9a6962b84c841eaabd5c4cbf8687ff34dbfe511) - Correct the link path of CONTRIBUTING.md in README.md files

## 2.1.1

### Patch Changes

- [#2388](https://github.com/lit/lit/pull/2388) [`5860533f`](https://github.com/lit/lit/commit/5860533f25180b6e8b616105cf85037216054d7a) - Fix choose directive jsdoc code example.

## 2.1.0

### Minor Changes

- [#2337](https://github.com/lit/lit/pull/2337) [`fcc2b3d0`](https://github.com/lit/lit/commit/fcc2b3d0054e69e6f76588ea9f440117b6d0deed) - Add a `keyed(key, value)` directive that clears a part if the key changes.

* [#2335](https://github.com/lit/lit/pull/2335) [`d319cf5f`](https://github.com/lit/lit/commit/d319cf5fde1c2b70185ee9a6252067ed0edaf2fc) - Add `when`, `map`, `join`, and `range` directives.

- [#2341](https://github.com/lit/lit/pull/2341) [`1d563e83`](https://github.com/lit/lit/commit/1d563e830c02a2d1a22e1e939f1ace971b1d1ae7) - Add choose() directive

### Patch Changes

- [#2307](https://github.com/lit/lit/pull/2307) [`221cb0a9`](https://github.com/lit/lit/commit/221cb0a90787631dcc867959de19febd2ebd3fd0) - Added an additional check to prevent spoofing of internal lit types in data bindings.

## 2.0.2

### Patch Changes

- [#2146](https://github.com/lit/lit/pull/2146) [`8bb33c88`](https://github.com/lit/lit/commit/8bb33c882bf5a9a215efac9dd9dd8665285a417d) - Work around a Chrome bug with trusted types: https://crbug.com/993268

* [#2236](https://github.com/lit/lit/pull/2236) [`5fc3818a`](https://github.com/lit/lit/commit/5fc3818afa43365b90b921ea0fd8f41e970e767f) - Prevent `polyfillSupport.noPatchSupported` from implicitly being `any`.
  Deduplicate types for `DevMode`-suffixed polyfill support functions.

## 2.0.1

### Patch Changes

- [#2152](https://github.com/lit/lit/pull/2152) [`ba5e1391`](https://github.com/lit/lit/commit/ba5e139163049014e6261123ff808700352b86a8) - Replace dynamic name lookups for polyfill support functions with static names.

## 2.0.0

### Major Changes

- The `templateFactory` option of `RenderOptions` has been removed.
- `TemplateProcessor` has been removed.
- Symbols are not converted to a string before mutating DOM, so passing a Symbol to an attribute or text binding will result in an exception.
- The `shady-render` module has been removed and is now part of `platform-support`, and Lit's polyfill support now adds the following limitations: (1) Bindings in style elements are no longer supported. Previously these could not change and in the future they may be supported via static bindings. (2) `ShadyCSS.styleElement` is no longer called automatically. This must be called whenever dynamic changes that affect styling are made that involve css custom property shimming (older browsers) or changes to custom properties used via the deprecated `@apply` feature. It was previously called only on first render, and it is now up to the user to decide when this should be called. See [Polyfills](https://lit.dev/docs/tools/requirements/#polyfills) for more details.
- `render()` no longer clears the container it's rendered to. It now appends to the container by default.
- Expressions in comments are no longer rendered or updated. See [Valid expression locations](https://lit.dev/docs/templates/expressions/#expression-locations) for more details.
- Template caching happens per callsite, not per template-tag/callsize pair. This means some rare forms of highly dynamic template tags are no longer supported.
- Arrays and other iterables passed to attribute bindings are not specially handled. Arrays will be rendered with their default toString representation. This means that ``html`<div class=${['a', 'b']}>`` will render `<div class="a,b">` instead of `<div class="a b">`. To get the old behavior, use `array.join(' ')`.
- Multiple bindings in a single attribute value don't require the attribute value is quoted, as long as there is no whitespace or other attribute-ending character in the attribute value. `` html`<div id=${a}-${b}>` ``
- The directive and part APIs are significantly different. See [Custom Directives](https://lit.dev/docs/templates/custom-directives/) and the [Upgrade Guide](https://lit.dev/docs/releases/upgrade/#update-custom-directive-implementations) for more details.
- The `Directive` base class and `directive()` factory function are
  now exported from the `lit-html/directive.js` module.
- `NodePart` has been renamed to `ChildPart`,
  along with other methods and variables that use the "Node" naming, like
  `PartType.Node` which is now `PartType.CHILD`.
- The part exports (`ChildPart`,
  `AttributePart`, etc) have been change to interface-only exports. The constructors are no longer exported. Directive authors should use helpers in `directive-helpers.js` to construct parts.
- The `eventContext` render option has been changed to `host`.
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

- [#1764](https://github.com/lit/lit/pull/1764) [`0b4d6eda`](https://github.com/lit/lit/commit/0b4d6eda5220aeb53abe250217d70dcb8f45fe43) - Don't allow classMap to remove static classes. This keeps classMap consistent with building a string out of the classnames to be applied.

### Minor Changes

- Added `renderBefore` to render options. If specified, content is rendered before the node given via render options, e.g. `{renderBefore: node}`.
- Added development mode, which can be enabled by setting the `development` Node exports condition. See [Development and production builds](https://lit.dev/docs/tools/development/#development-and-production-builds) for more details.
- All usage of `instanceof` has been removed, making rendering more likely to
  work when multiple instances of the library interact.
- Template processing is more robust to expressions in places other than text and attribute values.
- `render` now returns the `ChildPart` that was created/updated by `render`.
- Added `AsyncDirective`, which is a `Directive` subclass whose
  `disconnected` callback will be called when the part containing the directive
  is cleared (or transitively cleared by a Part higher in the tree) or manually
  disconnected using the `setConnected` API, and whose `reconnected` callback
  will be called when manually re-connected using `setConnected`. When
  implementing `disconnected`, the `reconnected` callback should also be
  implemented to return the directive to a usable state. Note that `LitElement`
  will disconnect directives upon element disconnection, and re-connect
  directives upon element re-connection. See [Async directives](https://lit.dev/docs/templates/custom-directives/#async-directives) for more details.
- Added `setConnected(isConnected: boolean)` to `ChildPart`; when called with
  `false`, the `disconnected` callback will be run on any directives contained within
  the part (directly or transitively), but without clearing or causing a
  re-render to the tree. When called with `true`, any such directives'
  `reconnected` callback will be called prior to its next `update`/`render`
  callbacks. Note that `LitElement` will call this method by default on the
  rendered part in its `connectedCallback` and `disconnectedCallback`.
- Added the `static-html` module, a static `html` tag function, a `literal` tag function, and `unsafeStatic()`, which allows template authors to add strings to the
  static structure of the template, before it's parsed as HTML. See [Static expressions](https://lit.dev/docs/templates/expressions/#static-expressions) for more details.
- Added `lit-html/directive-helpers.js` module with helpers for creating custom directives. See [Custom directives](https://lit.dev/docs/api/custom-directives/#clearPart) for more details.
- Rendering `null`, `undefined`, or empty string in a `ChildPart` now has the same affect as rendering `nothing`: it does not produce an empty text node. When rendering into an element with Shadow DOM, this makes it harder to inadvertently prevent `<slot>` fallback content from rendering.
- Nested directives whose parent returns `noChange` are now unchanged. This
  allows the `guard` directive to guard directive values ([#1519](https://github.com/Polymer/lit-html/issues/1519)).
- Added optional `creationScope` to `RenderOptions`, which controls the node from which the template is cloned from.
- Added support for running with [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types) enforced.

### Patch Changes

- [#1922](https://github.com/lit/lit/pull/1922) [`8189f094`](https://github.com/lit/lit/commit/8189f09406a5ee2f2c7351884486944fd46e1d5b) - Binding `noChange` into an interpolated attribute expression now no longer removes the attribute on first render - instead it acts like an empty string. This is mostly noticable when using `until()` without a fallback in interpolated attributes.

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* [#2070](https://github.com/lit/lit/pull/2070) [`a48f39c8`](https://github.com/lit/lit/commit/a48f39c8d5872dbc9a19a9bc72b22692950071f5) - Throw instead of rendering an innocuous value into a style or script when security hooks are enabled.

* [#2044](https://github.com/lit/lit/pull/2044) [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0) - Improves disconnection handling for first-party `AsyncDirective`s (`until`, `asyncAppend`, `asyncReplace`) so that the directive (and any DOM associated with it) can be garbage collected before any promises they are awaiting resolve.

## 2.0.0-rc.5

### Patch Changes

- [#2098](https://github.com/lit/lit/pull/2098) [`b3121ab7`](https://github.com/lit/lit/commit/b3121ab7ce71d6947d1081995e962806f32bc5ea) - Fix ChildPart parentNode for top-level parts to return the parentNode they _will_ be inserted into, rather than the DocumentFragment they were cloned into. Fixes #2032.

* [#2103](https://github.com/lit/lit/pull/2103) [`15a8356d`](https://github.com/lit/lit/commit/15a8356ddd59a1e80880a93acd21fadc9c24e14b) - Updates the `exports` field of `package.json` files to replace the [subpath
  folder
  mapping](https://nodejs.org/dist/latest-v16.x/docs/api/packages.html#packages_subpath_folder_mappings)
  syntax with an explicit list of all exported files.

  The `/`-suffixed syntax for subpath folder mapping originally used in these
  files is deprecated. Rather than update to the new syntax, this change replaces
  these mappings with individual entries for all exported files so that (a) users
  must import using extensions and (b) bundlers or other tools that don't resolve
  subpath folder mapping exactly as Node.js does won't break these packages'
  expectations around how they're imported.

- [#2074](https://github.com/lit/lit/pull/2074) [`d6b385e3`](https://github.com/lit/lit/commit/d6b385e3e4ae2ff23c1ecc3164fa7bb1a20c7dd5) - (Cleanup) Added missing tests to close out TODOs in the code.
  Fixed `unsafeHTML` and `unsafeSVG` to render no content (empty string) for values `undefined`, `null`, and `nothing`.

* [#1922](https://github.com/lit/lit/pull/1922) [`8189f094`](https://github.com/lit/lit/commit/8189f09406a5ee2f2c7351884486944fd46e1d5b) - Binding `noChange` into an interpolated attribute expression now no longer removes the attribute on first render - instead it acts like an empty string. This is mostly noticable when using `until()` without a fallback in interpolated attributes.

- [#2114](https://github.com/lit/lit/pull/2114) [`b4bd9f7c`](https://github.com/lit/lit/commit/b4bd9f7c7d036da8667cbd7075af4f6d6f27bc32) - Parts are not supported inside the `template` or `textarea` tags. In dev mode, we indicate if parts are placed here so the developer can remove them.

* [#2113](https://github.com/lit/lit/pull/2113) [`5b2f3642`](https://github.com/lit/lit/commit/5b2f3642ff91931b5b01f8bdd2ed98aba24f1047) - Dependency upgrades including TypeScript 4.4.2

- [#2072](https://github.com/lit/lit/pull/2072) [`7adfbb0c`](https://github.com/lit/lit/commit/7adfbb0cd32a7eab82551aa6c9d1434e7c4b563e) - Remove unneeded `matches` support in @queryAssignedNodes. Update styling tests to use static bindings where needed. Fix TODOs related to doc links.

* [#2119](https://github.com/lit/lit/pull/2119) [`24feb430`](https://github.com/lit/lit/commit/24feb4306ec3ddf2996c678a266a211b52f6aff2) - Added lit.dev/msg links to dev mode warnings.

- [#1764](https://github.com/lit/lit/pull/1764) [`0b4d6eda`](https://github.com/lit/lit/commit/0b4d6eda5220aeb53abe250217d70dcb8f45fe43) - Don't allow classMap to remove static classes. This keeps classMap consistent with building a string out of the classnames to be applied.

* [#2071](https://github.com/lit/lit/pull/2071) [`01353317`](https://github.com/lit/lit/commit/013533178ded7fb5e533e15f6dc982de25d12b94) - In dev mode, throw for tag name bindings. These should use static templates.

- [#2070](https://github.com/lit/lit/pull/2070) [`a48f39c8`](https://github.com/lit/lit/commit/a48f39c8d5872dbc9a19a9bc72b22692950071f5) - Throw instead of rendering an innocuous value into a style or script when security hooks are enabled.

* [#2075](https://github.com/lit/lit/pull/2075) [`724a9aab`](https://github.com/lit/lit/commit/724a9aabe263fb9dafee073e74de50a1aeabbe0f) - Ensures dev mode warnings do not spam by taking care to issue unique warnings only once.

- [#2076](https://github.com/lit/lit/pull/2076) [`0d703bfb`](https://github.com/lit/lit/commit/0d703bfbc9eb515a6bba8bf5ca608bbcd60fee98) - Optimize setting primitives on ChildNode.

* [#2073](https://github.com/lit/lit/pull/2073) [`0312f3e5`](https://github.com/lit/lit/commit/0312f3e533611eb3f4f9381594485a33ad003b74) - (Cleanup) Removed obsolete TODOs from codebase

- [#2056](https://github.com/lit/lit/pull/2056) [`e5667d66`](https://github.com/lit/lit/commit/e5667d66f4da58e74206fdef526b1c21a6e45925) - Fixed issue where `AsyncDirective`s could see `this.isConnected === true` if a LitElement performed its initial render while it was disconnected.

* [#2128](https://github.com/lit/lit/pull/2128) [`cc5c3a09`](https://github.com/lit/lit/commit/cc5c3a09a150bd19ce5445333dfb3799d33e03de) - Add test for AsyncDirectives that synchronously call this.setValue()

- [#2046](https://github.com/lit/lit/pull/2046) [`043a16fb`](https://github.com/lit/lit/commit/043a16fbfbd55c71fbee399691537765277694ea) - In development mode, constructing an `EventPart` from an improperly formed attribute will now throw: the attribute must contain only a single expression and the surrounding two strings must be the empty string. Before, constructing an `EventPart` with extra expressions or surrounding text would cause that part to be silently and incorrectly treated as an `AttributePart`.

* [#2043](https://github.com/lit/lit/pull/2043) [`761375ac`](https://github.com/lit/lit/commit/761375ac9ef28dd0ba8a1f9363aaf5f0df725205) - Update some internal types to avoid casting `globalThis` to `any` to retrieve globals where possible.

## 2.0.0-rc.4

### Major Changes

- [#1959](https://github.com/lit/lit/pull/1959) [`69389958`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302) - Changed all prefixes used for minifying object and class properties from greek
  characters to ASCII, to avoid requiring an explicit script charset on some
  browser/webview environments.

### Patch Changes

- [#2002](https://github.com/lit/lit/pull/2002) [`ff0d1556`](https://github.com/lit/lit/commit/ff0d15568fe79019ebfa6b72b88ba86aac4af91b) - Fixes polyfill-support styling issues: styling should be fully applied by firstUpdated/update time; late added styles are now retained (matching Lit1 behavior)

* [#2034](https://github.com/lit/lit/pull/2034) [`5768cc60`](https://github.com/lit/lit/commit/5768cc604dc7fcb2c95165399180179d406bb257) - Reverts the change in Lit 2 to pause ReactiveElement's update cycle while the element is disconnected. The update cycle for elements will now run while disconnected as in Lit 1, however AsyncDirectives must now check the `this.isConnected` flag during `update` to ensure that e.g. subscriptions that could lead to memory leaks are not made when AsyncDirectives update while disconnected.

- [#1942](https://github.com/lit/lit/pull/1942) [`c8fe1d4`](https://github.com/lit/lit/commit/c8fe1d4c4a8b1c9acdd5331129ae3641c51d9904) - For minified class fields on classes in lit libraries, added prefix to stable properties to avoid collisions with user properties.

* [#2041](https://github.com/lit/lit/pull/2041) [`52a47c7e`](https://github.com/lit/lit/commit/52a47c7e25d71ff802083ca9b0751724efd3a4f4) - Remove some unnecessary internal type declarations.

- [#1959](https://github.com/lit/lit/pull/1959) [`6938995`](https://github.com/lit/lit/commit/69389958ab41b2ad3074fd86926ed18dc9968302) - Changed prefix used for minifying class field names on lit libraries to stay within ASCII subset, to avoid needing to explicitly set the charset for scripts in some browsers.

* [#1937](https://github.com/lit/lit/pull/1937) [`3663f09`](https://github.com/lit/lit/commit/3663f09af853bc92172c929a356e301b42b19f1f) - Re-export PropertyPart from 'directive.ts'

- [#1964](https://github.com/lit/lit/pull/1964) [`f43b811`](https://github.com/lit/lit/commit/f43b811405be32ce6caf82e80d25cb6170eeb7dc) - Don't publish src/ to npm.

* [#1991](https://github.com/lit/lit/pull/1991) [`f05be301`](https://github.com/lit/lit/commit/f05be301e36fce93ae887007c0bdd328e5434225) - Fixed bug where Template.createElement was not patchable by polyfill-support when compiled using closure compiler, leading to incorrect style scoping.

- [#2016](https://github.com/lit/lit/pull/2016) [`e6dc6a7`](https://github.com/lit/lit/commit/e6dc6a708adacec6a17a884784f821c3250d7532) - Clean up internal TypeScript types

* [#1990](https://github.com/lit/lit/pull/1990) [`56e8efd3`](https://github.com/lit/lit/commit/56e8efd3fc654396421e7024f82f0eac9d2c4d33) - Fixed an error thrown when an empty `<style></style>` tag is rendered while using the @apply shim under native Shadow DOM.

- [#2044](https://github.com/lit/lit/pull/2044) [`662209c3`](https://github.com/lit/lit/commit/662209c370d2f5f58cb2f24e558125f91baeebd0) - Improves disconnection handling for first-party `AsyncDirective`s (`until`, `asyncAppend`, `asyncReplace`) so that the directive (and any DOM associated with it) can be garbage collected before any promises they are awaiting resolve.

* [#1972](https://github.com/lit/lit/pull/1972) [`a791514b`](https://github.com/lit/lit/commit/a791514b426b790de2bfa4c78754fb62815e71d4) - Properties that must remain unminified are now compatible with build tools other than rollup/terser.

- [#2050](https://github.com/lit/lit/pull/2050) [`8758e06`](https://github.com/lit/lit/commit/8758e06c7a142332fd4c3334d8806b3b51c7f249) - Fix syntax highlighting in some documentation examples

---

Changes below were based on the [Keep a Changelog](http://keepachangelog.com/) format. All changes above are generated automatically by [Changesets](https://github.com/atlassian/changesets).

---

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [X.Y.Z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Fixed -->
<!-- ### Removed -->

## [2.0.0-rc.3] - 2021-05-07

### Fixed

- Exported the `Ref` interface.

## [2.0.0-rc.2] - 2021-04-20

### Changed

- Add dependency on trustedtypes typings.

## 2.0.0-rc.1 - 2021-04-20

### Added

- Added `defer-hydration` attribute handling to `experimental-hydrate`, which helps
  coordinate ordered wakeup of custom elements during hydration.
- Added support for running with [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types) enforced.

### Changed

- (Since 2.0.0-pre.7) Renamed `hydrate` module to `experimental-hydrate` to reflect its experimental nature. Experimental modules may undergo breaking changes within otherwise non-major releases.

## 2.0.0-pre.7 - 2021-03-31

### Added

- Added optional `creationScope` to `RenderOptions`, which controls the node from which the template is cloned from.
- (Since 2.0.0-pre.6) Reintroduced the `SVGTemplateResult` type.
  ([#1623](https://github.com/Polymer/lit-html/issues/1623))

### Fixed

- `@apply` now functions correctly under native Shadow DOM when template parts are used. ([#1739](https://github.com/Polymer/lit-html/pull/1739)).

- `styleMap()` now removes properties if the value is set to `undefined` or `null`, as opposed to not being a property of the style object. ([#1665](https://github.com/Polymer/lit-html/pull/1665)).

## [2.0.0-pre.6] - 2021-02-11

- (Since 2.0.0-pre.4) Added `asyncappend` and `asyncReplace` directives.

### Fixed

- Nested directives whose parent returns `noChange` are now unchanged. This
  allows the `guard` directive to guard directive values ([#1519](https://github.com/Polymer/lit-html/issues/1519)).

### Changed

- (Since 2.0.0-pre.4) Removes second `klass` argument from `isDirectiveResult` since it is generally not version-agnostic to test directives using `instanceof`. A new `getDirectiveClass` helper is introduced, which allows for directive class branding checks instead.
- (Since 2.0.0-pre.4) `DisconnectableDirective` was renamed to `AsyncDirective`, and its module name was renamed from `disconnectable-directive` to `async-directive`.
- (Since 2.0.0-pre.4) Rendering `null`, `undefined`, or empty string in a `ChildPart` now has the same affect as rendering `nothing`: it does not produce an empty text node. When rendering into an element with Shadow DOM, this makes it harder to inadvertently prevent `<slot>` fallback content from rendering.
- (Since 2.0.0-pre.4) `DisconnectableDirective`'s `disconnectedCallback` and `reconnectedCallback` were renamed to `disconnected` and `reconnected`.
- (Since 2.0.0-pre.4) Renamed `platform-support` to `polyfill-support`.

## [2.0.0-pre.4] - 2020-12-16

### Added

- `render` now returns the `NodePart` that was created/updated by `render`.

- Added `DisconnectableDirective`, which is a `Directive` subclass whose
  `disconnectedCallback` will be called when the part containing the directive
  is cleared (or transitively cleared by a Part higher in the tree) or manually
  disconnected using the `setConnected` API, and whose `reconnectedCallback`
  will be called when manually re-connected using `setConnected`. When
  implementing `disconnectedCallback`, `reconnectedCallback` should also be
  implemented to return the directive to a usable state. Note that `LitElement`
  will disconnect directives upon element disconnection, and re-connect
  directives upon element re-connection.

- Added `setConnected(isConnected: boolean)` to `NodePart`; when called with
  `false`, `disconnectedCallback` will be run on any directives contained within
  the part (directly or transitively), but without clearing or causing a
  re-render to the tree. When called with `true`, any such directives'
  `reconnectedCallback` will be called prior to its next `update`/`render`
  callbacks. Note that `LitElement` will call this method by default on the
  rendered part in its `connectedCallback` and `disconnectedCallback`.

- Added `unsafeStatic()`, which allows template authors to add strings to the
  static structure of the template, before it's parsed as HTML.

- Added `isPrimitive()`, `isTemplateResult()`, and `isDirectiveResult()` to `lit-html/directive-helpers.js`.

### Changed

- Directives that asynchronously update their part value must now
  extend `DisconnectableDirective` and call `this.setValue()`, a new API exposed
  on the `DisconnectableDirective` class. Directives that render synchronously
  to their `update` lifecycle should simply return the value to be committed to
  their part from `update`/`render`.

- The `Directive` base class and `directive()` factory function are
  now exported from the `lit-html/directive.js` module.

- (since 2.0.0-pre.3) The Part type constants (`NODE_PART`, etc) are
  removed from the main `lit-html` module and exported as an enum-object named
  `PartType` from `lit-html/directive.js`. Use `PartType.NODE` instead of
  `NODE_TYPE`.

- (since 2.0.0-pre.3)) `lit-html/parts.js` has been renamed to
  `lit-html/directive-helpers.js`.

- (since 2.0.0-pre.3)) Originally in `lit-html/parts.js`,
  `createAndInsertPart()` and `insertPartBefore()` have been combined into a single `insertPart()` function in `lit-html/directive-helpers.js`. `detachNodePart()` and `restoreNodePart()` have been removed in favor of moving parts with `insertPart()`.

- (since 2.0.0-pre.3) `NodePart` has been renamed to `ChildPart`,
  along with other methods and variables that use the "Node" naming, like
  `PartType.Node` which is now `PartType.CHILD`.

- (since 2.0.0-pre.3) The `DirectiveClass`, `DirectiveParameters`
  and `PartInfo` types have been moved from `lit-html` to
  `lit-html/directive.ts`.

- (since 2.0.0-pre.3) The part exports (`ChildPart`,
  `AttributePart`, etc) have been change to interface-only exports. The constructors are no longer exported. Directive authors should use helpers in `directive-helpers.js` to construct parts.

- (since 2.0.0-pre.3) The `setPartValue` function in
  `directive-helpers.js` has been renamed to `setChildPartValue` and now only
  supports ChildParts. Directives that require updating their container
  part outside the `render`/`update` lifecycle should extend
  `DisconnectableDirective` and use `this.setValue()`.
- (since 2.0.0-pre.3) The `eventContext` render option has been changed to `host`.

  <!-- ### Fixed -->
  <!-- ### Removed -->

## [2.0.0-pre.3] - 2020-09-21

### Changed

- The `shady-render` module has been removed and is now part of `platform-support`. There are also a couple of breaking changes. (1) Bindings in style elements are no longer supported. Previously these could not change and in the future they may be supported via static bindings. (2) `ShadyCSS.styleElement` is no longer called automatically. This must be called whenever dynamic changes that affect styling are made that involve css custom property shimming (older browsers) or changes to custom properties used via the deprecated `@apply` feature. It was previously called only on first render, and it is now up to the user to decide when this should be called.
- `render()` no longer clears the container it's rendered to. It now appends to the container by default.
- Expressions in comments are not rendered or updated.
- Template caching happens per callsite, not per template-tag/callsize pair. This means some rare forms of highly dynamic template tags are no longer supported.
- Arrays and other iterables passed to attribute bindings are not specially handled. Arrays will be rendered with their default toString representation. This means that ``html`<div class=${['a', 'b']}>`` will render `<div class="a,b">` instead of `<div class="a b">`. To get the old behavior, use `array.join(' ')`.
- Multiple bindings in a single attribute value don't require the attribute value is quoted, as long as there is no whitespace or other attribute-ending character in the attribute value. ``html`<div id=${a}-${b}>``
- The directive and part APIs are significantly different. See the [README](README.md) for more details.

### Added

- Added `renderBefore` to render options. If specified, content is rendered before the node given via render options, e.g. `{renderBefore: node}`.
- Added development mode, which can be enabled by setting the `development` Node exports condition. See `README.md` for more details.

### Fixed

- All usage of `instanceof` has been removed, making rendering more likely to
  work when multiple instances of the library interact.
- Template processing is more robust to expressions in places other than text and attribute values.

### Removed

- The `templateFactory` option of `RenderOptions` has been removed.
- TemplateProcessor has been removed.
- Symbols are not converted to a string before mutating DOM, so passing a Symbol to an attribute or text binding will result in an exception.
- The `asyncAppend` and `asyncReplace` directives are not implemented.

## [1.3.0] - 2020-08-19

### Changed

- Set the "type" field in package.json to "module. ([#1146](https://github.com/Polymer/lit-html/pull/1146))

### Added

- Added support for [Trusted Types](https://github.com/WICG/trusted-types). This support uses a policy named 'lit-html' for parsing the static parts of html literals, and ensures that we pass trusted type values through to the DOM when used in bindings. ([#1153](https://github.com/Polymer/lit-html/pull/1153))
- Export the `shadyTemplateFactory` from `lib/shady-render.js` ([#1135](https://github.com/Polymer/lit-html/pull/1135))

## [1.2.1] - 2020-03-19

### Fixed

- Added TypeScript type declarations for older versions of TypeScript. We're currently testing back to TS 3.4. We can't commit to never breaking TypeScript builds, but we'll be supporting older versions as best we can.

## [1.2.0] - 2020-03-18

### Added

- Added `unsafeSVG` directive to bind SVG source inside SVGs. ([#304](https://github.com/Polymer/lit-html/issues/304))
- Added `templateContent()` directive for stamping out the contents of an HTML template into a text binding. ([#1058](https://github.com/Polymer/lit-html/issues/1058))
- Added the `live()` directive. ([#877](https://github.com/Polymer/lit-html/issues/877))

### Fixed

- Fixed a bug where `classMap` and `styleMap` directives wouldn't render mutated objects. ([#972](https://github.com/Polymer/lit-html/issues/972))
- Fixed a bug where ifDefined() would set an attribute even when the value didn't change. ([#890](https://github.com/Polymer/lit-html/issues/890))
- Change `classMap` directive to set classes correctly on SVGs ([#1070](https://github.com/Polymer/lit-html/issues/1070)).

## [1.1.2] - 2019-08-12

### Fixed

- Fixed a bug where bindings in comments could be written as text in some cases. ([#926](https://github.com/Polymer/lit-html/issues/926))

## [1.1.1] - 2019-07-09

### Changed

- `render` and `shady-render` now both accept any value that is renderable by `NodePart`. ([#910](https://github.com/Polymer/lit-html/issues/910))

## [1.1.0] - 2019-05-20

### Changed

- Many small performance enhancements.
- Private names are now named with a `__` prefix ([#859](https://github.com/Polymer/lit-html/issues/859)).

### Added

- Setup continuous benchmarking with Tachometer ([#887](https://github.com/Polymer/lit-html/issues/887)).

### Fixed

- Prevent empty styles from causing exceptions or breaking rendering when using `shady-render` ([#760](https://github.com/Polymer/lit-html/issues/760)).
- Primitive values in attributes are now always simply stringified, regardless of whether they are iterable. ([#830](https://github.com/Polymer/lit-html/pull/830))
- Adopt and upgrade template fragments after processing for parts ([#831](https://github.com/Polymer/lit-html/issues/831)).
- Fixed bindings with attribute-like expressions preceeding them ([#855](https://github.com/Polymer/lit-html/issues/855)).
- Fixed errors with bindings in HTML comments ([#882](https://github.com/Polymer/lit-html/issues/882)).

## [1.0.0] - 2019-02-05

### Changed

- Tons of docs updates ([#746](https://github.com/Polymer/lit-html/pull/746)), ([#675](https://github.com/Polymer/lit-html/pull/675)), ([#724](https://github.com/Polymer/lit-html/pull/724)), ([#753](https://github.com/Polymer/lit-html/pull/753)), ([#764](https://github.com/Polymer/lit-html/pull/764)), ([#763](https://github.com/Polymer/lit-html/pull/763)), ([#765](https://github.com/Polymer/lit-html/pull/765)), ([#767](https://github.com/Polymer/lit-html/pull/767)), ([#768](https://github.com/Polymer/lit-html/pull/768)), ([#734](https://github.com/Polymer/lit-html/pull/734)), ([#771](https://github.com/Polymer/lit-html/pull/771)), ([#766](https://github.com/Polymer/lit-html/pull/766)), ([#773](https://github.com/Polymer/lit-html/pull/773)), ([#770](https://github.com/Polymer/lit-html/pull/770)), ([#769](https://github.com/Polymer/lit-html/pull/769)), ([#777](https://github.com/Polymer/lit-html/pull/777)), ([#776](https://github.com/Polymer/lit-html/pull/776)), ([#754](https://github.com/Polymer/lit-html/pull/754)), ([#779](https://github.com/Polymer/lit-html/pull/779))

### Added

- Global version of `lit-html` on window ([#790](https://github.com/Polymer/lit-html/pull/790)).

### Fixed

- Removed use of `any` outside of test code ([#741](https://github.com/Polymer/lit-html/pull/741)).

## [1.0.0-rc.2] - 2019-01-09

### Changed

- Performance improvements to template processing. ([#690](https://github.com/Polymer/lit-html/pull/690))

### Added

- Added the `nothing` sentinel value which can be used to clear a part. ([#673](https://github.com/Polymer/lit-html/pull/673))

### Fixed

- Fixed #702: a bug with the `unsafeHTML` directive when changing between unsafe and other values. ([#703](https://github.com/Polymer/lit-html/pull/703))
- Fixed #708: a bug with the `until` directive where placeholders could overwrite resolved Promises. ([#721](https://github.com/Polymer/lit-html/pull/721))

## [1.0.0-rc.1] - 2018-12-13

### Fixed

- Documentation updates.
- Fixed typing for template_polyfill `createElement` call.

## [0.14.0] - 2018-11-30

### Changed

- `until()` can now take any number of sync or async arguments. ([#555](https://github.com/Polymer/lit-html/pull/555))
- `guard()` supports multiple dependencies. If the first argument to `guard()` is an array, the array items are checked for equality to previous values. ([#666](https://github.com/Polymer/lit-html/pull/666))
- Renamed `classMap.js` and `styleMap.js` files to kebab-case. ([#644](https://github.com/Polymer/lit-html/pull/644))

### Added

- Added `cache()` directive. ([#646](https://github.com/Polymer/lit-html/pull/646))
- Removed Promise as a supposed node-position value type. ([#555](https://github.com/Polymer/lit-html/pull/555))
- Added a minimal `<template>` polyfill.

### Removed

- Removed the `when()` directive. Users may achieve similar behavior by wrapping a ternary with the `cache()` directive.

### Fixed

- Bound attribute names are rewritten to avoid IE/Edge removing SVG and style attributes. ([#640](https://github.com/Polymer/lit-html/pull/640))
- Ensure shady-render prepares styling for a scope before attaching child elements. ([#664](https://github.com/Polymer/lit-html/pull/664))
- Handle CSS Custom Variables in the styleMap directive. [#642](https://github.com/Polymer/lit-html/pull/642))

## [0.13.0] - 2018-11-08

### Changed

- Directives are now defined by passing the entire directive factory function to `directive()`. ([#562](https://github.com/Polymer/lit-html/pull/562))

### Fixed

- Fix issue on obscure browsers that do not accept event listener objects by using callback as event part listener ([#581](https://github.com/Polymer/lit-html/pull/581))
- Fix KeyFn and ItemTemplate types ([#570](https://github.com/Polymer/lit-html/pull/570))
- Don't use export \* to workaround rollup bug ([#556](https://github.com/Polymer/lit-html/pull/556))
- `eventContext` is no longer used as the `this` value for event listener objects (object with a `handleEvent` method), as the object itself is supposed to be the `this` value. ([#576](https://github.com/Polymer/lit-html/pull/576))

## [0.12.0] - 2018-10-05

### Changed

- Re-implemented repeat directive for better performance ([#501](https://github.com/Polymer/lit-html/pull/501))
- Updated TypeScript dependency to 3.1
- `render()` now takes an options object as the third argument. ([#523](https://github.com/Polymer/lit-html/pull/523))

### Added

- Event listeners are called with a configurable `this` reference, which is set via the `eventContext` option to `render()`. ([#523](https://github.com/Polymer/lit-html/pull/523))
- Support for event listener options, by passing the listener itself as both the second and third arguments to add/removeEventListener().

## [0.11.4] - 2018-09-17

### Fixed

- Fixed issues with `shady-render` introduced in 0.11.3 ([#504](https://github.com/Polymer/lit-html/issues/504) and [#505](https://github.com/Polymer/lit-html/issues/505)).

## [0.11.3] - 2018-09-13

### Changed

- Moved upgrading of custom elements in template fragments to a common location in TemplateInstance ([#489](https://github.com/Polymer/lit-html/pull/489))
- Rewrite render() to reuse the logic in NodePart. render() now supports all the data types that NodeParts do. ([#491](https://github.com/Polymer/lit-html/pull/491))

### Fixed

- Fixed bug when using the ShadyCSS @apply` shim. ([#502](https://github.com/Polymer/lit-html/pull/502))

## [0.11.2] - 2018-09-12

### Added

- Added `classMap` and `styleMap` directives ([#486](https://github.com/Polymer/lit-html/pull/486))

### Fixed

- Fixed bug in asyncReplace when rerendering the same iterable ([#485](https://github.com/Polymer/lit-html/pull/485))
- Update properties before upgrading custom elements ([#455](https://github.com/Polymer/lit-html/pull/455))
- Cache the ShadyCSS version lookup ([#477](https://github.com/Polymer/lit-html/pull/477))

## [0.11.1] - 2018-09-02

### Changed

- Eliminated a cycle in the module import graph ([#472](https://github.com/Polymer/lit-html/pull/472))
- Remove the default value for the templateProcessor parameter in TemplateResult#constuctor, making it a required parameter ([#472](https://github.com/Polymer/lit-html/pull/472))

## [0.11.0] - 2018-08-28

### Added

- Added support for property, event, and boolean bindings to default syntax ([#398](https://github.com/Polymer/lit-html/pull/398))
- Added guard directive ([#438](https://github.com/Polymer/lit-html/pull/438))
- Added when directive ([#439](https://github.com/Polymer/lit-html/pull/439))

### Changed

- Split implementation into multiple small modules and merged lit-html.js and core.js ([#436](https://github.com/Polymer/lit-html/pull/436))
- Moved directives into top-level `directives/` directory ([#436](https://github.com/Polymer/lit-html/pull/436))
- Replaced `PartCallback` with `TemplateProcessor` ([#405](https://github.com/Polymer/lit-html/pull/405))
- Unified `NodePart` and `AttributePart` interfaces ([#400](https://github.com/Polymer/lit-html/pull/400))
  - AttributePart#setValue() takes a single value
  - `Part` has separate `setValue()` and `commit()` phases
  - Added `AttributeCommitter` to commit attribute values once for multiple `AttributeParts`

### Removed

- Removed lit-extended.js ([#436](https://github.com/Polymer/lit-html/pull/436))

### Fixed

- Render initial undefined values in attributes ([#377](https://github.com/Polymer/lit-html/pull/377))
- Handle case-sensitive attributes like `viewBox` correctly ([#376](https://github.com/Polymer/lit-html/pull/376))
- Support bindings in `<template>` elements ([#343](https://github.com/Polymer/lit-html/pull/343))
- Don’t break templates when HTML comments have bindings in them ([#446](https://github.com/Polymer/lit-html/pull/446))
- IE: Don't use Set() constructor arguments ([#401](https://github.com/Polymer/lit-html/pull/401))
- Handle forms as Node instead of iterable ([#404](https://github.com/Polymer/lit-html/pull/404))
- Update values after upgrading custom elements ([#385](https://github.com/Polymer/lit-html/pull/385))
- Dirty check primitive values passed to unsafeHTML() ([#384](https://github.com/Polymer/lit-html/pull/384))
- Handle forms as Node instead of iterable ([#404](https://github.com/Polymer/lit-html/pull/404))
- Upgrade disconnected custom elements before setting properties on them. ([#442](https://github.com/Polymer/lit-html/pull/442))
- Fix style attribute bindings in IE ([#448](https://github.com/Polymer/lit-html/pull/448))

## [0.10.1] - 2018-06-13

- Added `noChange` - Value in favour of `directiveValue` (deprecated).
  - A `noChange` - Value signals that a value was handled by a directive and should not be written to the DOM
- Updated shady-render to render styles in order, work with `@apply`, and work in browers where CSS Custom Properties must be polyfilled, like IE 11.
- Introduced API to modify template contents safely without breaking template parts
  - `insertNodeIntoTemplate(template: Template, node: Node, refNode: Node|null)`
  - `removeNodesFromTemplate(template: Template, nodesToRemove: Set<Node>)`

## [0.10.0] - 2018-05-03

- Added IE11 support
- Declarative events in lit-extended are more efficient when handlers change

## [0.9.0] - 2018-02-01

- Refactored how template tags and `render()` are implemented so that all
  specialization of template syntax is done in tags, not `render()`, allowing
  for the mixing-in of templates of different syntaxes, and for hooks in
  `render()` to change templates before they're initially processed.
- Added ShadyCSS support in lib/shady-render.js. It's exported render function
  will pass templates to ShadyCSS's `prepareTemplate()` function to process style
  tags and elements in the template for emulate CSS scoping.
- lit-extended: Attribute bindings with a `?` suffix on the name now act as boolean
  attributes. The attribute will be removed for falsey values and set to `''` for
  truthy values, matching the HTML specification behavior for boolean attributes.
- Fixed a bug where directives rendered incorrectly on AttributeParts and PropertyParts

## [0.8.0] - 2018-01-12

- Allow all valid HTML attribute names, including emoji and Angular-style
  `(foo)=` and `[foo]=` names.
- Drastically improved performance of the `repeat` directive.
- Fixed an issue with expressions directly following elements.
- Fixed numerous bugs with the `repeat` directive.
- Performance improvements for template setup
- Internal code cleanup
- Support synchronous thenables
- Added the `asyncAppend` and `asyncReplace` directives to handle async iterable values in expressions.

## [0.7.0] - 2017-10-06

- Added the `svg` template tag for creating partial SVG content
- Support for expressions inside tables and other elements with limited permitted content
- Only remove whitespace between elements, or at the start or end of elements
- Fixed bugs with rendering iterables
- A few IE/Edge fixes. Closer to full support.

## [0.6.0] - 2017-09-01

- Fixed removing event handlers when setting them to `undefined`.
- Allow the text "{{}}" to appear in templates.
- Optimized clearing of Parts.
- Added `unsafeHTML()` directive to bind values as HTML source.
- Optimizations, simplification and bug fixes of Array handling code.
- Update to extension API: added partCallback parameter to `render()`.
- Added the `directive()` decorator function to create directives. Functions values are no longer treated as directive by default, simplifying declarative event handlers.
