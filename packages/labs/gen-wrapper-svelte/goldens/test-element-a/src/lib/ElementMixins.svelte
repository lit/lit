<script lang="ts">
  import "@lit-internal/test-element-a/element-mixins.js";
  import { setProperties } from "$lib/util.js";

  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    mixedProp?: number | undefined;
  }
  export interface Events {}
  export interface Slots {
    children?: Snippet;
  }
  const {
    class: className,
    style,
    children,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-mixins use:setProperties={props} class={className} {style}>
  {#if children}
    {@render children()}
  {/if}
</element-mixins>
