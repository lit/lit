/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ChildPart, TemplateResult, noChange, render} from 'lit';
import {AsyncDirective} from 'lit/async-directive.js';
import {directive, DirectiveResult, PartInfo, PartType} from 'lit/directive.js';
import {_recycledLists, RecycledListAdapter} from './Virtualizer.js';

/**
 * Configuration the virtualize directive passes into `recycledList` on
 * every render. `first`/`last` are inclusive, absolute item indices
 * (not positions within `items`) so the directive can use them as
 * stable slot identities.
 */
export interface RecycledListConfig<T> {
  items: Array<T>;
  first: number;
  last: number;
  renderItem: (item: T, index: number) => TemplateResult;
}

/**
 * A single pool entry. `container` is a plain `<div>` that the
 * virtualizer positions (via transform) and measures. The user's
 * rendered row is committed as a child of `container` by calling
 * `lit-html`'s top-level `render()` with the row's template. The
 * container element is stable for the lifetime of the slot, so we
 * can use it as the stable identity the virtualizer's positioning
 * and measurement paths look up via the `RecycledListAdapter`.
 *
 * `itemIndex` is the current item assignment — stable across most
 * scrolls, changing only when a scroll cycles this slot onto a new
 * item.
 */
interface PoolSlot {
  container: HTMLElement;
  itemIndex: number;
}

/**
 * Marker attribute placed on every slot container so the Virtualizer's
 * `_children` walk can still tell a "real" child from an unrelated
 * element (e.g. the sizer). In practice the inspector test utilities
 * use `host.children` directly, so this attribute is mostly a
 * debugging aid — it makes recycled-mode DOM easy to spot in devtools.
 */
const SLOT_ATTRIBUTE = 'virtualizer-slot';

class RecycledListDirective<T = unknown> extends AsyncDirective {
  private _pool: PoolSlot[] = [];
  // itemIndex → PoolSlot. Reverse of the per-slot `itemIndex` field,
  // kept in sync on every assignment for O(1) lookup in the "does
  // this item already have a slot?" check on the hot path.
  private _slotByItemIndex = new Map<number, PoolSlot>();
  // The virtualizer's host element — the physical parent of every
  // pool slot's container. Captured on first update, used to register
  // with the `_recycledLists` WeakMap.
  private _hostElement: HTMLElement | null = null;
  // Last-seen items array reference. When this changes across
  // updates, even slots whose `itemIndex` is still in range need
  // their templates re-committed — the item object at a given index
  // may have changed even though the index didn't.
  private _lastItems: ReadonlyArray<T> | null = null;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error(
        'The recycledList directive can only be used in child expressions'
      );
    }
  }

  render(_config: RecycledListConfig<T>) {
    // All work happens in `update()`, which owns its slot containers
    // directly as children of the virtualizer host. `render()` exists
    // only to satisfy the Directive contract; its return value is
    // never committed because `update()` returns `noChange`.
    return noChange;
  }

  update(containerPart: ChildPart, [config]: [RecycledListConfig<T>]) {
    // Resolve the host element on first update and register the
    // adapter so the Virtualizer can look children up by item index.
    // `ChildPart.parentNode` (public getter) walks up through any
    // intermediate DocumentFragments (initial unattached render) to
    // find the real DOM parent the part will eventually commit into.
    if (this._hostElement === null) {
      const parent = containerPart.parentNode;
      if (parent && parent.nodeType === 1) {
        this._hostElement = parent as HTMLElement;
        _recycledLists.set(this._hostElement, this._buildAdapter());
      }
    }
    if (this._hostElement) {
      this._reconcile(config);
    }
    return noChange;
  }

  /**
   * Given the new visible range `[first..last]`, update the pool so
   * every visible item is represented by a slot and every slot
   * represents a visible item. Slots whose item is still in range
   * keep their assignment (and therefore skip all reactive-update
   * work). Only slots that actually cycle have their template
   * re-committed.
   */
  private _reconcile(config: RecycledListConfig<T>): void {
    const host = this._hostElement!;
    const {items, first, last, renderItem} = config;
    const rangeSize = last - first + 1;
    // If the items array reference changed, every slot needs its
    // template re-committed — even slots whose item *index* is still
    // in range, because the item *data* at that index may have
    // changed. We detect that with a reference comparison and treat
    // the whole cycle as "everything is dirty".
    const itemsChanged = items !== this._lastItems;
    this._lastItems = items as ReadonlyArray<T>;

    if (rangeSize <= 0) {
      // Empty range — clear the pool entirely. Rare (happens when
      // the items array is emptied or the viewport shrinks to zero).
      for (const slot of this._pool) {
        slot.container.remove();
      }
      this._pool.length = 0;
      this._slotByItemIndex.clear();
      return;
    }

    // Phase 1: figure out which current slots are still valid and
    // which are free to be repurposed. `needed` is the set of item
    // indices we must have a slot for after reconciliation. If the
    // items array itself changed, treat every slot as in need of a
    // re-commit (drop existing index assignments so Phase 2 falls
    // into the "reuse a free slot" branch for every visible item).
    const needed = new Set<number>();
    for (let i = first; i <= last; i++) {
      needed.add(i);
    }
    const freeSlots: PoolSlot[] = [];
    if (itemsChanged) {
      // All current slots go into the free list; all visible items
      // will be re-committed into them in Phase 2.
      for (const slot of this._pool) {
        freeSlots.push(slot);
      }
      this._slotByItemIndex.clear();
    } else {
      for (const slot of this._pool) {
        if (!needed.has(slot.itemIndex)) {
          freeSlots.push(slot);
          this._slotByItemIndex.delete(slot.itemIndex);
        }
      }
    }

    // Phase 2: for each needed item, either keep its existing slot
    // (no work) or claim a free slot / grow the pool. This is where
    // the actual rendering work happens — calling `render()` on a
    // slot whose item is changing triggers lit-html's template diff
    // and ultimately the row component's reactive update. Slots that
    // were not freed are skipped entirely: no template is re-committed
    // and no per-row work runs for them.
    for (let idx = first; idx <= last; idx++) {
      if (this._slotByItemIndex.has(idx)) {
        continue;
      }
      let slot: PoolSlot;
      const reused = freeSlots.pop();
      if (reused) {
        slot = reused;
        slot.itemIndex = idx;
      } else {
        // Grow the pool. New containers are appended at the end of
        // the host; DOM order reflects pool-creation order, not
        // item-index order. That divergence is why the Virtualizer
        // has to consult the adapter (`_recycledLists`) to look
        // children up by item index in its positioning path.
        const container = document.createElement('div');
        container.setAttribute(SLOT_ATTRIBUTE, '');
        host.appendChild(container);
        slot = {container, itemIndex: idx};
        this._pool.push(slot);
      }
      this._slotByItemIndex.set(idx, slot);
      // Commit the row's template into the slot container. On the
      // first commit to a fresh container, `render` instantiates the
      // template and inserts the DOM. On subsequent commits to an
      // existing container, `render` diffs and updates bindings in
      // place — exactly the hot-path reuse we want.
      render(renderItem(items[idx], idx), slot.container);
    }

    // Phase 3: shrink the pool if there are leftover free slots.
    // Only happens when the range shrinks (items removed, or
    // viewport shrinks and the layout reports fewer visible items).
    // On the steady-state hot path there are no leftovers.
    if (freeSlots.length > 0) {
      const freeSet = new Set(freeSlots);
      for (const slot of freeSlots) {
        slot.container.remove();
      }
      this._pool = this._pool.filter((s) => !freeSet.has(s));
    }
  }

  private _buildAdapter(): RecycledListAdapter {
    return {
      getChildForIndex: (itemIdx: number): HTMLElement | null => {
        const slot = this._slotByItemIndex.get(itemIdx);
        return slot ? slot.container : null;
      },
      getIndexForChild: (child: HTMLElement): number | null => {
        // Linear scan over the pool. Pool size is bounded by the
        // overscan-expanded visible range, so this is fast in
        // practice and called only during measurement passes.
        for (const slot of this._pool) {
          if (slot.container === child) {
            return slot.itemIndex;
          }
        }
        return null;
      },
    };
  }

  disconnected() {
    // Our slot containers live directly under the virtualizer host,
    // outside lit-html's own ChildPart tree. lit-html will clean up
    // its own content when the containing template re-renders or
    // tears down, but it won't touch our slots. Remove them here.
    for (const slot of this._pool) {
      slot.container.remove();
    }
    this._pool.length = 0;
    this._slotByItemIndex.clear();
    this._lastItems = null;
    if (this._hostElement) {
      _recycledLists.delete(this._hostElement);
      this._hostElement = null;
    }
  }

  reconnected() {
    // If the directive is reconnected to a new container, we'll
    // re-capture the host element on the next update() call and
    // re-populate the pool. Nothing to do here eagerly.
  }
}

/**
 * Custom lit-html directive used internally by the `virtualize`
 * directive when `recycle: true` is set. Maintains a fixed pool of
 * row containers whose item assignments are stable across scrolls,
 * so row component instances are reused and only one slot's template
 * is re-committed per scroll step.
 *
 * Not exported from the package's public API yet; callers opt in via
 * `recycle: true` on `VirtualizeDirectiveConfig` and let the
 * directive pick the right rendering path.
 */
export const recycledList = directive(RecycledListDirective) as <T>(
  config: RecycledListConfig<T>
) => DirectiveResult<typeof RecycledListDirective>;
