<script lang="ts">
  import "@lit-internal/test-element-a/element-colliding-prop-and-slot.js";
  import { setProperties } from "$lib/util.js";

  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    contentProp?: string;
  }
  export interface Events {}
  export interface Slots {
    contentSnippet?: Snippet;
  }
  const {
    class: className,
    style,
    contentSnippet,
    ...rawProps
  } = $props<Props & Events & Slots>();
  const props = {
    ...rawProps,
    content: rawProps.contentProp,
  };
</script>

<element-colliding-prop-and-slot
  use:setProperties={props}
  class={className}
  {style}
>
  {#if contentSnippet}
    <div slot="content">
      {@render contentSnippet()}
    </div>
  {/if}
</element-colliding-prop-and-slot>
