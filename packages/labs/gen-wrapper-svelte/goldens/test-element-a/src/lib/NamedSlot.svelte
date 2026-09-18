<script lang="ts">
  import type { Snippet } from "svelte";
  import { assignSlot, SLOT_MARKER } from "$lib/util.js";

  interface Props {
    /** Name of the custom element slot to assign the content to. */
    name: string;
    content: Snippet<[any]>;
    /** Argument for parameterized snippets, e.g. `tab-<id>-icon`. */
    arg?: unknown;
  }

  const { name, content, arg }: Props = $props();

  // Text cannot carry a `slot` attribute. Once the snippet renders text, fall
  // back to a display: contents wrapper that carries it instead.
  let wrapped = $state(false);
  const marker = { slot: SLOT_MARKER };
</script>

{#if wrapped}
  <span {...{ slot: name }} style="display: contents"
    >{@render content(arg)}</span
  >
{:else}
  <template
    {...marker}
    use:assignSlot={{ name, onText: () => (wrapped = true) }}
  ></template>{@render content(arg)}<template {...marker}></template>
{/if}
