<script lang="ts">
  import "@lit-internal/test-element-a/element-colliding-prop-and-slot.js";
  import { setProperties } from "$lib/util.js";
  import NamedSlot from "$lib/NamedSlot.svelte";

  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    content?: string;
  }
  export interface Events {}
  export interface Slots {
    contentSnippet?: Snippet;
  }
  const {
    class: className,
    style,
    contentSnippet,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-colliding-prop-and-slot
  use:setProperties={props}
  class={className}
  {style}
>
  {#if contentSnippet}
    <NamedSlot name="content" content={contentSnippet} />
  {/if}
</element-colliding-prop-and-slot>
