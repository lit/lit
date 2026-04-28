# Add Virtualizer Lifecycle Logging

Add diagnostic logging to the virtualizer's key lifecycle points. This logging has proven essential for debugging scroll behavior, position estimation, and freeze/unfreeze cycles.

All logs use the `[virt:xxx]` prefix for easy filtering in the browser console.

## Logging points

### Virtualizer.ts

**`_updateDOM`** — logs every state update from the layout, showing range, child positions, scroll error, and current scrollTop:

```typescript
// At the top of _updateDOM, before any state is applied:
const {first, last} = state.range;
const se = state.scrollError?.block;
const cp = state.childPositions;
let posInfo = '';
if (cp.size > 0) {
  const entries = [...cp.entries()];
  const f = entries[0];
  const l = entries[entries.length - 1];
  posInfo = ` first=${f[0]}@${Math.round(f[1].insetBlockStart)} last=${l[0]}@${Math.round(l[1].insetBlockStart)}`;
}
console.log(
  `[virt:updateDOM] range=${first}-${last} positions=${cp.size}${posInfo} scrollErr=${se != null ? Math.round(se) : '-'} scrollTop=${Math.round(this._scrollerController?.scrollTop ?? 0)}`
);
```

**`_updateDOM` range changed** — logs when `_notifyRange` is called (skipping `_finishDOMUpdate`):

```typescript
// Inside the `if (_rangeChanged || _itemsChanged)` block:
console.log(`[virt:updateDOM] rangeChanged → notifyRange (no finishDOMUpdate)`);
```

**`_finishDOMUpdate`** — logs when positions are actually flushed to the DOM, showing first/last item positions and scrollTop:

```typescript
// After _positionChildren, before _correctScrollError:
const pos = this._childrenPos;
if (pos && pos.size > 0) {
  const entries = [...pos.entries()];
  console.log(
    `[virt:finishDOM] positioned=${pos.size} first=${entries[0][0]}@${Math.round(entries[0][1].insetBlockStart)} last=${entries[entries.length - 1][0]}@${Math.round(entries[entries.length - 1][1].insetBlockStart)} scrollTop=${Math.round(this._scrollerController?.scrollTop ?? 0)}`
  );
}
```

**`_handleScrollEvent` freeze** — logs when the scroll freeze triggers:

```typescript
// Inside the `if (!this._scrollFrozen)` block:
console.log(
  `[virt:freeze] delta=${Math.round(delta)} threshold=${Math.round(clientHeight * this._scrollFreezeThreshold)} scrollTop=${Math.round(scrollTop)}`
);
```

**`_unfreezeScroll`** — logs when the freeze ends:

```typescript
// After setting _lastBlockScrollPosition:
console.log(
  `[virt:unfreeze] scrollTop=${Math.round(this._lastBlockScrollPosition)}`
);
```

### flow.ts (FlowLayout)

**`_updateLayout`** — logs cross-axis dimension changes that trigger cache clearing:

```typescript
// Inside the dim2 change detection:
console.log(
  `[virt:layout] crossAxis changed ${this._lastViewDim2} → ${this._viewDim2}, clearing cache outside [${this._first},${this._last}]`
);
```

**`_updateVirtualizerSize` scroll correction** — logs when `_pendingScrollCorrection` fires:

```typescript
// After calculating the ratio:
console.log(
  `[virt:scrollCorrection] size ${Math.round(oldSize)} → ${Math.round(newSize)} ratio=${ratio.toFixed(3)} scrollPos ${Math.round(this._blockScrollPosition)} → ${Math.round(this._blockScrollPosition * ratio)}`
);
```

## How to read the logs

- **Healthy cycle**: `updateDOM` → `finishDOM` with matching positions and scrollTop
- **Range change**: `updateDOM` → `rangeChanged → notifyRange` → (host re-renders) → `finishDOM`
- **Scroll correction**: `scrollErr=N` in `updateDOM`, then `finishDOM` shows adjusted scrollTop
- **Freeze/unfreeze**: `freeze` → (silence during drag) → `unfreeze` → normal cycle resumes
- **Red flags**: positions far from scrollTop in `finishDOM`; cascading `scrollErr` values; `rangeChanged` without a subsequent `finishDOM`
