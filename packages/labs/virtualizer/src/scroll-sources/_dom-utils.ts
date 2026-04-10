/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * DOM utilities shared by the DOM-based ScrollSource implementations
 * (`AncestorScrollSource`, `SelfScrollSource`). Underscored to flag the
 * file as an internal helper not meant for re-export.
 */

// Module-state polyfill hook for `ResizeObserver`. Mirrors the same
// pattern in `Virtualizer.ts`. Both must be initialized via
// `provideResizeObserver()` for full coverage when running in
// environments that lack a native implementation.
export let _ResizeObserver: typeof ResizeObserver | undefined =
  typeof window !== 'undefined' ? window.ResizeObserver : undefined;

/**
 * Inject a `ResizeObserver` polyfill that DOM-based scroll sources will
 * use instead of the global. Mirrors `provideResizeObserver()` in
 * `Virtualizer.ts`; both must be called for full coverage.
 */
export function provideResizeObserver(Ctor: typeof ResizeObserver) {
  _ResizeObserver = Ctor;
}

/**
 * Returns the effective parent element of `el`, traversing across shadow
 * DOM boundaries. Mirrors the helper in `Virtualizer.ts`. Three cases:
 *
 *   1. `el.assignedSlot` — when the element is slotted into a shadow
 *      root, the slot is its effective parent in the flat tree.
 *   2. `el.parentElement` — normal DOM parent.
 *   3. A `DocumentFragment` parent that is a `ShadowRoot` — escape from
 *      the shadow root to its host.
 *
 * TODO: Deal with iframes.
 */
export function getParentElement(el: Element): Element | null {
  if (el.assignedSlot !== null) {
    return el.assignedSlot;
  }
  if (el.parentElement !== null) {
    return el.parentElement;
  }
  const parentNode = el.parentNode;
  if (parentNode && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return (parentNode as ShadowRoot).host || null;
  }
  return null;
}

/**
 * Walks up the (shadow-DOM-aware) DOM tree from `el` and collects
 * ancestors. Set `includeSelf` to `true` to include `el` as the first
 * entry of the result.
 */
export function getElementAncestors(el: HTMLElement, includeSelf = false) {
  const ancestors: HTMLElement[] = [];
  let parent = includeSelf ? el : (getParentElement(el) as HTMLElement | null);
  while (parent !== null) {
    ancestors.push(parent);
    parent = getParentElement(parent) as HTMLElement | null;
  }
  return ancestors;
}

/**
 * Returns the chain of clipping ancestors of `el`. A clipping ancestor
 * is one whose computed `overflow` is not `visible`. Stops walking
 * after encountering a `position: fixed` ancestor (since fixed
 * positioning detaches an element from its scroll context). Excludes
 * `display: contents` ancestors because they generate no box and have
 * no meaningful overflow.
 *
 * Set `includeSelf` to `true` to include `el` itself as a candidate
 * (used by self-scroller mode where the host element is the scroll
 * container).
 */
export function getClippingAncestors(el: HTMLElement, includeSelf = false) {
  let foundFixed = false;
  return getElementAncestors(el, includeSelf).filter((a) => {
    if (foundFixed) {
      return false;
    }
    const style = getComputedStyle(a);
    foundFixed = style.position === 'fixed';
    if (style.display === 'contents') {
      return false;
    }
    return style.overflow !== 'visible';
  });
}
