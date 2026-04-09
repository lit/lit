# @lit-labs/virtualizer Issue Triage

Last updated: 2026-04-08

## Summary

| Status              | Count |
| ------------------- | ----- |
| Fixed pending merge | 10    |
| In progress         | 3     |
| Confirmed           | 0     |
| Needs investigation | 4     |
| Needs repro         | 1     |

---

## Bugs by Priority

### P1 -- Major functionality broken

| #     | Title                                                       | Subsystem           | Status                | Branch / PR        | Notes                                                                                                                            |
| ----- | ----------------------------------------------------------- | ------------------- | --------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| #4922 | Regression: no content renders (display:contents ancestors) | rendering           | fixed-pending-merge   | PR #5279           | Exclude display:contents elements from clipping ancestors                                                                        |
| #4789 | Metrics cache not reset on items change                     | measurement         | fixed-pending-merge   | PR #5279           | Cache cleared when items array changes                                                                                           |
| #4670 | Flow layout incorrect after replacing items                 | layout              | fixed-pending-merge   | PR #5279           | Metrics cache keyed properly with keyFunction                                                                                    |
| #4767 | scrollIntoView to far element renders blank                 | scroll              | fixed-separate-branch | `gnorton/fix-4767` | Fix exists but not on current PR branch; needs merge                                                                             |
| #4693 | Anomalous scrolling when item heights change on resize      | layout, measurement | fixed-pending-merge   | PR #5279           | Clear stale off-screen cache entries on cross-axis resize; proportional scroll correction.                                       |
| #4945 | Focused item removed from DOM on scroll                     | rendering           | needs-investigation   | --                 | Accessibility: focus jumps to body when item is recycled. Breaks keyboard navigation.                                            |
| #4833 | renderItem called with undefined                            | rendering           | needs-repro           | --                 | Occurs when items change to subset without scrolling. Author promised repro steps but hasn't provided them. Related to PR #4846. |

### P2 -- Significant issue, workaround exists

| #     | Title                                     | Subsystem         | Status              | Branch / PR      | Notes                                                                                                                                                                                       |
| ----- | ----------------------------------------- | ----------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4827 | averageMarginSize in metrics cache is off | measurement       | fixed-pending-merge | PR #5279         | First-item margin defaulting to 0 skews average                                                                                                                                             |
| #5212 | No guard on customElements.define         | infra             | in-progress         | PR #5232         | Simple fix: add existence check. Microfrontend use case.                                                                                                                                    |
| #4839 | Child placement via absolute positioning  | layout, rendering | in-progress         | PR #5280 (draft) | Feature: alternative to CSS transform. Addresses Mobile Safari memory leak.                                                                                                                 |
| #5006 | Scroll performance with high velocity     | scroll, rendering | fixed-pending-merge | PR #5279         | Freeze layout updates during large scroll jumps; unfreeze with clean state reset. freeze/unfreeze Layout API, MutationObserver characterData+subtree, anchor validation, lazy anchor reset. |

### P3 -- Minor or nice-to-have

| #     | Title                                                       | Subsystem         | Status              | Branch / PR | Notes                                                                                                                                             |
| ----- | ----------------------------------------------------------- | ----------------- | ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| #4982 | message can be null in isResizeObserverLoopErrorMessage     | infra             | fixed-pending-merge | PR #5279    | Added `typeof message === 'string'` guard                                                                                                         |
| #5285 | Flow layout off-by-one errors in margin collapsing          | layout            | fixed-pending-merge | PR #5279    | Three `getMarginSize()` index lookups used wrong index. Only manifests with non-uniform margins.                                                  |
| #5286 | scrollToIndex scrolls to margin edge instead of border edge | layout, scroll    | fixed-pending-merge | PR #5279    | Override `_calculateScrollIntoViewPosition` in Flow to use visual position. Related trailing-margin scroll-size issue noted in comments on #5286. |
| #5008 | Use bigint for min-height/transform with huge lists         | layout            | needs-investigation | --          | Precision loss at 500K+ items. Edge case. Has repro.                                                                                              |
| #5042 | Remove ResizeObserver polyfill                              | infra             | needs-investigation | --          | Dead polyfill, browser support universal since 2020. Volunteer available.                                                                         |
| #4540 | Support sticky items                                        | layout, rendering | needs-investigation | --          | Fundamentally incompatible with current absolute positioning. Architectural.                                                                      |

---

## Feature Requests

| #     | Title                                    | Priority | Status                 | Notes                                                    |
| ----- | ---------------------------------------- | -------- | ---------------------- | -------------------------------------------------------- |
| #4839 | Child placement via absolute positioning | P2       | in-progress (PR #5280) | Addresses Mobile Safari memory leak (WebKit bug #277392) |
| #4945 | Focused item stays in DOM                | P1       | needs-investigation    | Accessibility requirement; React Aria does this          |
| #4540 | Sticky items                             | P3       | needs-investigation    | Requires architectural change to positioning model       |

---

## Documentation

| #        | Title                                  | Status              | Notes                                       |
| -------- | -------------------------------------- | ------------------- | ------------------------------------------- |
| #4505    | Document grid layout                   | needs-investigation | Good First Issue. Playground demo exists.   |
| PR #4692 | Add keyFunction docs and JSDoc updates | in-progress         | Awaiting review from kevinpschaaf           |
| PR #4691 | Improve RenderItemFunction type + docs | in-progress         | Relaxes type to accept any stringable value |

---

## Fixed Pending Merge

All on PR #5279 (`virtualizer/css-direction--bug-fixes`):

| #     | Title                                            | Test Commit | Fix Commit |
| ----- | ------------------------------------------------ | ----------- | ---------- |
| #4789 | Metrics cache not reset on items change          | `d52ca3f4`  | `624d6070` |
| #4827 | averageMarginSize off                            | `11fbf13b`  | `57480fd1` |
| #4670 | Layout incorrect after replacing items           | `56e2b918`  | `8edbda2d` |
| #4922 | No content renders (display:contents)            | `d4d9441f`  | `39996580` |
| #4982 | null message in isResizeObserverLoopErrorMessage | `33c6c605`  | `fd3a610e` |
| #4693 | Anomalous scrolling on cross-axis resize         | --          | `b4883d2f` |
| #5006 | Scroll performance with high velocity            | --          | `b4883d2f` |
| #5285 | Flow layout margin off-by-one                    | `be609bf8`  | `d9fdf693` |
| #5286 | scrollToIndex margin offset                      | `66cfdd9c`  | `e54dc14a` |

Separate branch:

| #     | Title                        | Branch             | Fix Commit |
| ----- | ---------------------------- | ------------------ | ---------- |
| #4767 | scrollIntoView renders blank | `gnorton/fix-4767` | `32d8dd4a` |

---

## Related Issue Clusters

- **Metrics cache**: #4789, #4827, #4670 -- all involve stale or incorrect metrics cache behavior. All fixed in PR #5279.
- **Scroll positioning**: #4767, #4827 -- graynorton noted fix for #4767 would also address #4827's root cause.
- **Item identity/replacement**: #4670, #4833 -- both involve items array changes producing incorrect behavior.
- **ResizeObserver**: #4982, #5042 -- both relate to ResizeObserver infrastructure.
- **Documentation**: #4505, PR #4692, PR #4691 -- all docs improvements by different authors.
- **Container resize / fast scroll**: #4693, #5006 -- both addressed by cross-axis cache clearing, scroll freeze during large jumps, and Layout freeze/unfreeze API.
- **Flow layout margin handling**: #5285, #5286 -- both surfaced by the same non-uniform-margin playground repro. #5285 is off-by-one in the collapsed-margin index lookups; #5286 is the scroll-to using margin-box instead of border-box.

---

## Open PRs

| PR    | Title                                      | Branch                                                 | Issues                                                        | Status                |
| ----- | ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------- | --------------------- |
| #5280 | Child positioning method API               | `virtualizer/css-direction--bug-fixes--implement-4839` | #4839                                                         | Draft                 |
| #5279 | Bug fixes                                  | `virtualizer/css-direction--bug-fixes`                 | #4789, #4827, #4670, #4922, #4982, #4693, #5006, #5285, #5286 | Open                  |
| #5249 | CSS-based direction detection and axis API | `virtualizer/css-direction`                            | --                                                            | Open                  |
| #5232 | Guard custom element registration          | `fixes/5212`                                           | #5212                                                         | Open                  |
| #4846 | Virtualizer fixes (external)               | `virtualizer-fixes`                                    | --                                                            | Draft                 |
| #4692 | keyFunction docs                           | --                                                     | lit.dev#1322                                                  | Open, awaiting review |
| #4691 | Type and docs improvement                  | --                                                     | #4377                                                         | Open, awaiting review |

---

## Branch Stack

**Bug fix target branch**: `virtualizer/css-direction--bug-fixes` (PR #5279)

The active development branches form a stack:

1. `virtualizer/css-direction` (PR #5249) -- CSS direction detection
2. `virtualizer/css-direction--bug-fixes` (PR #5279) -- bug fixes for #4789, #4827, #4670, #4922, #4982
3. `virtualizer/css-direction--bug-fixes--implement-4839` (PR #5280) -- #4839 positioning API

---

## Known Issue Numbers

For monitoring (no GitHub label exists):
4505, 4540, 4670, 4693, 4767, 4789, 4827, 4833, 4839, 4922, 4945, 4982, 5006, 5008, 5042, 5212, 5285, 5286
