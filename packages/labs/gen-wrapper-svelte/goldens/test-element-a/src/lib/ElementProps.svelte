<script lang="ts">
  export type {
    MyType,
    AttributeVariant,
  } from "@lit-internal/test-element-a/element-props.js";
  import "@lit-internal/test-element-a/element-props.js";
  import { setProperties } from "$lib/util.js";
  import type {
    MyType,
    AttributeVariant,
  } from "@lit-internal/test-element-a/element-props.js";
  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    aStr?: string;
    aNum?: number;
    aBool?: boolean;
    aStrArray?: string[];
    aMyType?: MyType;
    variant?: AttributeVariant;
  }
  export interface Events {
    onAChanged?: (event: CustomEvent<unknown>) => void;
  }
  export interface Slots {
    children?: Snippet;
  }
  const {
    onAChanged,
    class: className,
    style,
    children,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-props
  use:setProperties={props}
  class={className}
  {style}
  ona-changed={onAChanged}
>
  {#if children}
    {@render children()}
  {/if}
</element-props>
