<script lang="ts">
  export type { ElementSubEnum } from "@lit-internal/test-element-a/sub/element-sub.js";
  import "@lit-internal/test-element-a/sub/element-sub.js";
  import { setProperties } from "$lib/util.js";
  import type { ElementSubEnum } from "@lit-internal/test-element-a/sub/element-sub.js";
  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    foo?: string | undefined;
    enum?: ElementSubEnum | undefined;
  }
  export interface Events {
    onSubChanged?: (event: CustomEvent<unknown>) => void;
  }
  export interface Slots {
    children?: Snippet;
    stuff?: Snippet;
  }
  const {
    onSubChanged,
    class: className,
    style,
    children,
    stuff,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-sub
  use:setProperties={props}
  class={className}
  {style}
  onsub-changed={onSubChanged}
>
  {#if children}
    {@render children()}
  {/if}

  {#if stuff}
    <div slot="stuff">
      {@render stuff()}
    </div>
  {/if}
</element-sub>
