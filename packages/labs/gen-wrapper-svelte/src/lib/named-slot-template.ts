import {javascript} from '@oicl-lit/gen-utils/lib/str-utils.js';

/**
 * Shared component the wrappers use to forward a snippet into a named slot.
 *
 * The snippet renders directly into the custom element, between two
 * unassigned markers, and `assignSlot` sets `slot` on its top-level elements.
 * The content therefore slots natively, so percentage sizing and the
 * component's `::slotted()` rules behave as in the documented usage. A plain
 * `<div slot>` or a `display: contents` wrapper each break one or the other.
 *
 * `slot` is set through spreads because Svelte rejects a literal `slot`
 * attribute outside a custom element or component.
 */
export const namedSlotTemplate = () => javascript`
<script lang="ts">
  import type { Snippet } from "svelte";
  import { assignSlot, SLOT_MARKER } from "$lib/util.js";

  interface Props {
    /** Name of the custom element slot to assign the content to. */
    name: string;
    content: Snippet<[any]>;
    /** Argument for parameterized snippets, e.g. \`tab-<id>-icon\`. */
    arg?: unknown;
  }

  const { name, content, arg }: Props = $props();

  // Text cannot carry a \`slot\` attribute. Once the snippet renders text, fall
  // back to a display: contents wrapper that carries it instead.
  let wrapped = $state(false);
  const marker = { slot: SLOT_MARKER };
</script>

{#if wrapped}
  <span {...{ slot: name }} style="display: contents">{@render content(arg)}</span>
{:else}
  <template {...marker} use:assignSlot={{ name, onText: () => (wrapped = true) }}></template>{@render content(arg)}<template {...marker}></template>
{/if}
`;
