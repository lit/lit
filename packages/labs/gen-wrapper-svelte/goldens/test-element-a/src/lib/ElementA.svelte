<script lang="ts">
  import "@lit-internal/test-element-a/element-a.js";
  import { setProperties, forwardEvents } from "$lib/util.js";
  import NamedSlot from "$lib/NamedSlot.svelte";

  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    foo?: string | undefined;
  }
  export interface Events {
    onAChanged?: (event: CustomEvent<unknown>) => void;
  }
  export interface Slots {
    children?: Snippet;
    stuff?: Snippet;
    tabTitle0?: Snippet;
  }
  const {
    onAChanged,
    class: className,
    style,
    children,
    stuff,
    tabTitle0,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-a
  use:setProperties={props}
  class={className}
  {style}
  use:forwardEvents={{ "a-changed": onAChanged }}
>
  {#if children}
    {@render children()}
  {/if}

  {#if stuff}
    <NamedSlot name="stuff" content={stuff} />
  {/if}

  {#if tabTitle0}
    <NamedSlot name="tab-title-0" content={tabTitle0} />
  {/if}
</element-a>
