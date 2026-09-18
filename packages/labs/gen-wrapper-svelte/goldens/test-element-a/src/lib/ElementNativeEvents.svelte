<script lang="ts">
  export type { NativeDetail } from "@lit-internal/test-element-a/element-native-events.js";
  import "@lit-internal/test-element-a/element-native-events.js";
  import { setProperties, forwardEvents } from "$lib/util.js";
  import type { NativeDetail } from "@lit-internal/test-element-a/element-native-events.js";
  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    value?: number;
  }
  export interface Events {
    onInput?: (event: CustomEvent<NativeDetail>) => void;
    onValueChanged?: (event: CustomEvent<NativeDetail>) => void;
  }
  export interface Slots {
    children?: Snippet;
  }
  const {
    onInput,
    onValueChanged,
    class: className,
    style,
    children,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-native-events
  use:setProperties={props}
  class={className}
  {style}
  use:forwardEvents={{ input: onInput, "value-changed": onValueChanged }}
>
  {#if children}
    {@render children()}
  {/if}
</element-native-events>
