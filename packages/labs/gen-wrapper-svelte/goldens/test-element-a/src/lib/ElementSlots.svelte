<script lang="ts">
  export type {
    CellSlotsChangeEvent,
    CellIconSlotsChangeEvent,
  } from "@lit-internal/test-element-a/element-slots.js";
  import "@lit-internal/test-element-a/element-slots.js";
  import { setProperties, forwardEvents, trackSlotLists } from "$lib/util.js";
  import NamedSlot from "$lib/NamedSlot.svelte";
  import type {
    CellSlotsChangeEvent,
    CellIconSlotsChangeEvent,
  } from "@lit-internal/test-element-a/element-slots.js";
  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    mainDefault?: string;
    tabs?: { id: string; title: string }[];
  }
  export interface Events {
    onCellSlotsChange?: (event: CellSlotsChangeEvent) => void;
    onCellIconSlotsChange?: (event: CellIconSlotsChangeEvent) => void;
    onTabIconSlotsChange?: (event: CustomEvent<unknown>) => void;
  }
  export interface Slots {
    tabIcon?: Snippet<[any]>;
    cell?: Snippet<[CellSlotsChangeEvent["detail"][number]]>;
    cellIcon?: Snippet<[CellIconSlotsChangeEvent["detail"][number]]>;
  }
  const {
    onCellSlotsChange,
    onCellIconSlotsChange,
    onTabIconSlotsChange,
    class: className,
    style,
    tabIcon,
    cell,
    cellIcon,
    ...props
  } = $props<Props & Events & Slots>();
  let cellSlots = $state<CellSlotsChangeEvent["detail"][number][]>([]);
  const setCellSlots = (slots: CellSlotsChangeEvent["detail"][number][]) =>
    (cellSlots = slots);
  let cellIconSlots = $state<CellIconSlotsChangeEvent["detail"][number][]>([]);
  const setCellIconSlots = (
    slots: CellIconSlotsChangeEvent["detail"][number][],
  ) => (cellIconSlots = slots);
</script>

<element-slots
  use:setProperties={props}
  use:trackSlotLists={[
    { property: "cellSlots", event: "cell-slots-change", set: setCellSlots },
    {
      property: "cellIconSlots",
      event: "cell-icon-slots-change",
      set: setCellIconSlots,
    },
  ]}
  class={className}
  {style}
  use:forwardEvents={{
    "cell-slots-change": onCellSlotsChange,
    "cell-icon-slots-change": onCellIconSlotsChange,
    "tab-icon-slots-change": onTabIconSlotsChange,
  }}
>
  {#if props.tabs && tabIcon}
    {#each props.tabs as item}
      <NamedSlot name="tab-{item.id}-icon" content={tabIcon} arg={item} />
    {/each}
  {/if}

  {#if cell}
    {#each cellSlots as item (item.name)}
      <NamedSlot name={item.name} content={cell} arg={item} />
    {/each}
  {/if}

  {#if cellIcon}
    {#each cellIconSlots as item (item.name)}
      <NamedSlot name={item.name} content={cellIcon} arg={item} />
    {/each}
  {/if}
</element-slots>
