<script lang="ts">
  export type { Size } from "@lit-internal/test-element-a/element-enum.js";
  import "@lit-internal/test-element-a/element-enum.js";
  import { setProperties } from "$lib/util.js";
  import type { Size } from "@lit-internal/test-element-a/element-enum.js";
  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    size?: Size;
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

<element-enum use:setProperties={props} class={className} {style}>
  {#if children}
    {@render children()}
  {/if}
</element-enum>
