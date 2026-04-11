# @lit-labs/virtualizer Issue Triage

Last updated: 2026-04-10 (post-reinvestigation of #4767)

## Summary

| Status               | Count |
| -------------------- | ----- |
| Addressed (PR open)  | 2     |
| Addressed (PR draft) | 16    |
| Unaddressed          | 7     |

An issue is "addressed" if there is at least one open PR that, when merged, will close it. Draft PRs count as addressed but are flagged separately. All PRs in the main chain (#5249, #5279, #5280, #5292) are currently drafts. Of the out-of-chain PRs, #5232 is also a draft; only #4691 and #4692 are ready for review.

---

## Addressed Issues

### Bugs

#### P1

| #     | Title                                                  | Subsystem           | PR            | Test       | Fix        | Notes                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ------------------------------------------------------ | ------------------- | ------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4767 | scrollIntoView to far element renders blank            | scroll              | #5279 (draft) | `a16ebadd` | `deb88c2e` | Same root cause as #4827: `offsetWithinScroller` was scroll-position-dependent, producing cumulative position errors that at large scroll distances clamped to end-of-scroll and rendered zero items. Reinvestigation 2026-04-10 confirmed the `deb88c2e` fix also addresses this issue (bisected main → HEAD, broken at `e2d51db4`, fixed at `deb88c2e`). Regression test mirrors the jpzwarte gist repro. |
| #4922 | No content renders (display:contents ancestors)        | rendering           | #5279 (draft) | `fbe221d4` | `6313f1b7` | Exclude `display: contents` elements from clipping ancestor chain.                                                                                                                                                                                                                                                                                                                                          |
| #4789 | Metrics cache not reset on items change                | measurement         | #5279 (draft) | `46cc73f7` | `ad5cf0c4` | `_refineScrollSize()` recomputes exact scroll size when all items rendered; cache cleared on items change.                                                                                                                                                                                                                                                                                                  |
| #4670 | Flow layout incorrect after replacing items            | layout              | #5279 (draft) | `10325ac3` | `8c23049b` | `MutationObserver` now detects child reorders by `keyFunction` and triggers re-measurement.                                                                                                                                                                                                                                                                                                                 |
| #4693 | Anomalous scrolling when item heights change on resize | layout, measurement | #5279 (draft) | --         | `c3770a9a` | Clear stale off-screen cache entries on cross-axis resize; proportional scroll correction. (Combined commit with #5006.)                                                                                                                                                                                                                                                                                    |

#### P2

| #     | Title                                                         | Subsystem         | PR            | Test       | Fix        | Notes                                                                                                                                                                      |
| ----- | ------------------------------------------------------------- | ----------------- | ------------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4827 | averageMarginSize in metrics cache is off                     | measurement       | #5279 (draft) | `e2d51db4` | `deb88c2e` | scrollIntoView overshoot in non-scroller mode; off-by-one in `_estimatePosition`; index 0 excluded from inter-item margin cache. Confirmed to share root cause with #4767. |
| #5212 | No guard on customElements.define                             | infra             | #5232 (draft) | --         | --         | Simple fix: add existence check. Microfrontend use case.                                                                                                                   |
| #5006 | Scroll performance with high velocity                         | scroll, rendering | #5279 (draft) | --         | `c3770a9a` | freeze/unfreeze Layout API; `MutationObserver` characterData+subtree; anchor validation; lazy anchor reset. (Combined commit with #4693.)                                  |
| #5290 | virtualize directive: items don't render with positioned host | rendering         | #5279 (draft) | `d407b277` | `fb1b2631` | Defer `connected()` to a microtask when host isn't yet in the document, so `getComputedStyle()` and the ancestor walk return correct values.                               |

#### P3

| #     | Title                                                       | Subsystem      | PR            | Test       | Fix        | Notes                                                                                                                                                 |
| ----- | ----------------------------------------------------------- | -------------- | ------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4982 | message can be null in isResizeObserverLoopErrorMessage     | infra          | #5279 (draft) | `3b2236eb` | `adfc44e6` | Added `typeof message === 'string'` guard.                                                                                                            |
| #5285 | Flow layout off-by-one errors in margin collapsing          | layout         | #5279 (draft) | `e120afbf` | `63c5e549` | Three `getMarginSize()` index lookups used wrong index. Only manifests with non-uniform margins.                                                      |
| #5286 | scrollToIndex scrolls to margin edge instead of border edge | layout, scroll | #5279 (draft) | `426be50b` | `184ce375` | Override `_calculateScrollIntoViewPosition` in Flow to use visual (border-edge) position.                                                             |
| #5293 | ScrollerShim getters substitute legitimate 0                | scroll         | #5279 (draft) | --         | `e7b08356` | `scrollTop`/`scrollLeft` switched from `\|\|` to `??` so a real zero isn't replaced by `window.scrollY/X`. Single-commit fix without regression test. |

### Feature Requests

#### P2

| #     | Title                                                   | Subsystem         | PR            | Notes                                                                                                                                                                        |
| ----- | ------------------------------------------------------- | ----------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4839 | Child placement via absolute positioning                | layout, rendering | #5280 (draft) | Alternative to CSS transform; addresses Mobile Safari memory leak (WebKit bug #277392).                                                                                      |
| #5295 | Managed viewport mode for custom/synchronized scrollers | scroll, api       | #5292 (draft) | New `'managed'` scroller mode driven by an externally-set `viewport` property. Bundled with a `ScrollSource` strategy refactor and a public `Virtualizer.js` subpath export. |

### Documentation

| #     | Title                                              | PR            | Notes                                                                |
| ----- | -------------------------------------------------- | ------------- | -------------------------------------------------------------------- |
| #4505 | Document grid layout                               | #5249 (draft) | Grid layout docs added to README as a bonus on the css-direction PR. |
| #4377 | renderItem should accept non-TemplateResult values | #4691         | Type relaxation plus README/JSDoc updates by Garbee.                 |
| #5294 | Document keyFunction property in README            | #4692         | Tracking issue created retroactively (originally lit/lit.dev#1322).  |

### Other

(none)

---

## Unaddressed Issues

### Bugs

#### P1

| #     | Title                            | Subsystem | Status      | Notes                                                                                                                            |
| ----- | -------------------------------- | --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| #4833 | renderItem called with undefined | rendering | needs repro | Occurs when items change to subset without scrolling. Author promised repro steps but hasn't provided them. Related to PR #4846. |

#### P3

| #     | Title                                               | Subsystem | Status              | Notes                                                |
| ----- | --------------------------------------------------- | --------- | ------------------- | ---------------------------------------------------- |
| #5008 | Use bigint for min-height/transform with huge lists | layout    | needs investigation | Precision loss at 500K+ items. Edge case. Has repro. |

### Feature Requests

#### P1

| #     | Title                              | Subsystem | Status              | Notes                                                                                                                                                                       |
| ----- | ---------------------------------- | --------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4945 | Keep focused item in DOM on scroll | rendering | needs investigation | Accessibility: focus jumps to body when the focused item is recycled, breaking keyboard navigation. Framed as a limitation rather than a bug — requires architectural work. |

#### P3

| #     | Title                                   | Subsystem         | Status              | Notes                                                                                                                                                                                                      |
| ----- | --------------------------------------- | ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4540 | Support sticky items                    | layout, rendering | needs investigation | Fundamentally incompatible with current absolute positioning. Architectural.                                                                                                                               |
| #5281 | Build support for dev-only code blocks  | infra             | needs investigation | Proposes build-step stripping of `__DEV__`-guarded code so diagnostic logging can live permanently in source without production cost. Foundation for #5282.                                                |
| #5282 | Permanent, toggleable lifecycle logging | infra, rendering  | needs investigation | Makes the lifecycle logging in the `add-virtualizer-logging` skill permanent and runtime-toggleable instead of hand-added and hand-removed per debug session. Depends on #5281 (no-cost production build). |

### Documentation

(none)

### Other

| #     | Title                         | Status              | Notes                                                                                                                                                                                                                                                                                                                                                                             |
| ----- | ----------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #5291 | Reconsider viewport semantics | needs investigation | Placeholder for splitting `_updateView`'s single `viewportSize` into (a) available layout space — host's configured/measured size, both axes, never affected by ancestor clipping — and (b) currently visible range — clipping along the virtualization axis only. Subsumes the cross-axis grid sizing bug and the unverified `scroller: true` off-screen behavior. Drives #5290. |

---

## Related Issue Clusters

- **Metrics cache**: #4789, #4827, #4670 -- all involve stale or incorrect metrics cache behavior. All fixed in PR #5279.
- **Scroll positioning**: #4767, #4827 -- confirmed shared root cause. Both caused by `offsetWithinScroller` being computed from raw `getBoundingClientRect()` differences that drift with scroll position. At small scroll distances the drift manifests as ~30-item overshoot (#4827); at large scroll distances the cumulative error clamps to end-of-scroll and leaves the list blank (#4767). Both resolved by `deb88c2e` (the #4827 fix). Obsolete earlier attempt on `gnorton/fix-4767` branch (commit `32d8dd4a`) can be discarded.
- **Item identity/replacement**: #4670, #4833 -- both involve items array changes producing incorrect behavior.
- **Documentation**: PR #4691 (#4377), PR #4692 (#5294) -- both docs improvements by Garbee awaiting review. #4505 grid docs already addressed in PR #5249.
- **Container resize / fast scroll**: #4693, #5006 -- both addressed by cross-axis cache clearing, scroll freeze during large jumps, and Layout freeze/unfreeze API. Combined into a single fix commit.
- **Flow layout margin handling**: #5285, #5286 -- both surfaced by the same non-uniform-margin playground repro. #5285 is off-by-one in the collapsed-margin index lookups; #5286 is the scroll-to using margin-box instead of border-box.
- **Clipping ancestor detection**: #4922, #5290 -- both surface as wrong `_clippingAncestors` lists, but via different mechanisms. #4922: `display: contents` ancestors get classified as clipping (their zero-rect collapses the viewport). #5290: the directive runs `connected()` while the host is in an unattached fragment, so the ancestor walk and computed-style reads return wrong values. Both fixed in PR #5279.
- **Permanent diagnostic logging**: #5281, #5282 -- #5281 is the foundation (build support for stripping `__DEV__`-guarded code blocks in production); #5282 builds on it to provide permanent, runtime-toggleable lifecycle logging. Both connect to the existing `add-virtualizer-logging` skill, which currently documents ephemeral hand-added debug logging — the issues propose moving that pattern into the source tree permanently with a build-time gate.

---

## Open PRs

| PR    | Title                                         | Branch                                                   | Closes                                                                             | Status                |
| ----- | --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------- |
| #5292 | Managed viewport mode + ScrollSource refactor | `virtualizer/css-direction--bug-fixes--managed-viewport` | #5295                                                                              | Draft                 |
| #5280 | Child positioning method API                  | `virtualizer/css-direction--bug-fixes--implement-4839`   | #4839                                                                              | Draft                 |
| #5279 | Bug fixes                                     | `virtualizer/css-direction--bug-fixes`                   | #4767, #4789, #4827, #4670, #4922, #4982, #4693, #5006, #5285, #5286, #5290, #5293 | Draft                 |
| #5249 | CSS-based direction detection and axis API    | `virtualizer/css-direction`                              | #4505                                                                              | Draft                 |
| #5232 | Guard custom element registration             | `fixes/5212`                                             | #5212                                                                              | Draft                 |
| #4846 | Virtualizer fixes (external)                  | `virtualizer-fixes`                                      | --                                                                                 | Draft                 |
| #4692 | keyFunction docs                              | `virtualizer/docs`                                       | #5294                                                                              | Open, awaiting review |
| #4691 | Type and docs improvement                     | `virtualizer/types`                                      | #4377                                                                              | Open, awaiting review |

---

## Branch Stack

**Bug fix target branch**: `virtualizer/css-direction--bug-fixes` (PR #5279)

The active development branches form a tree rather than a linear stack. The chain descends linearly from `main` through #5249 to #5279; at #5279, two sibling branches (#5280 and #5292) branch off in parallel:

1. `virtualizer/css-direction` (PR #5249) -- CSS direction detection; base: `main`
2. `virtualizer/css-direction--bug-fixes` (PR #5279) -- bug fixes for #4789, #4827, #4670, #4922, #4982, #4693, #5006, #5285, #5286, #5290, #5293; base: `virtualizer/css-direction`
3. Sibling branches stacked on top of #5279 (both have base `virtualizer/css-direction--bug-fixes`, neither depends on the other):
   - `virtualizer/css-direction--bug-fixes--implement-4839` (PR #5280) -- #4839 positioning API
   - `virtualizer/css-direction--bug-fixes--managed-viewport` (PR #5292) -- managed viewport mode + ScrollSource refactor

All four PRs in the chain (#5249, #5279, #5280, #5292) are currently drafts, as is #5232. PRs #4691 and #4692 are not part of the tree, target `main` directly, and are ready for review.

---

## Known Issue Numbers

For monitoring (no GitHub label exists):
4377, 4505, 4540, 4670, 4693, 4767, 4789, 4827, 4833, 4839, 4922, 4945, 4982, 5006, 5008, 5212, 5281, 5282, 5285, 5286, 5290, 5291, 5293, 5294, 5295
