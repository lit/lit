<script lang="ts">
  export type { MyDetail } from "@lit-internal/test-element-a/detail-type.js";
  export type { EventSubclass } from "@lit-internal/test-element-a/element-events.js";
  export type { TypeSub } from "@lit-internal/test-element-a/sub/type-sub.js";
  export type { SpecialEvent } from "@lit-internal/test-element-a/special-event.js";
  export type { TemplateResult } from "lit";
  import "@lit-internal/test-element-a/element-events.js";
  import { setProperties } from "$lib/util.js";
  import type { MyDetail } from "@lit-internal/test-element-a/detail-type.js";
  import type { EventSubclass } from "@lit-internal/test-element-a/element-events.js";
  import type { TypeSub } from "@lit-internal/test-element-a/sub/type-sub.js";
  import type { SpecialEvent } from "@lit-internal/test-element-a/special-event.js";
  import type { TemplateResult } from "lit";
  import type { Snippet } from "svelte";

  export interface Props {
    class?: string;
    style?: string;
    foo?: string | undefined;
  }
  export interface Events {
    onStringCustomEvent?: (event: CustomEvent<string>) => void;
    onNumberCustomEvent?: (event: CustomEvent<number>) => void;
    onMyDetailCustomEvent?: (event: CustomEvent<MyDetail>) => void;
    onEventSubclass?: (event: EventSubclass) => void;
    onTypeSubCustomEvent?: (event: CustomEvent<TypeSub>) => void;
    onSpecialEvent?: (event: SpecialEvent) => void;
    onTemplateResultCustomEvent?: (event: CustomEvent<TemplateResult>) => void;
  }
  export interface Slots {
    children?: Snippet;
  }
  const {
    onStringCustomEvent,
    onNumberCustomEvent,
    onMyDetailCustomEvent,
    onEventSubclass,
    onTypeSubCustomEvent,
    onSpecialEvent,
    onTemplateResultCustomEvent,
    class: className,
    style,
    children,
    ...props
  } = $props<Props & Events & Slots>();
</script>

<element-events
  use:setProperties={props}
  class={className}
  {style}
  onstring-custom-event={onStringCustomEvent}
  onnumber-custom-event={onNumberCustomEvent}
  onmy-detail-custom-event={onMyDetailCustomEvent}
  onevent-subclass={onEventSubclass}
  ontype-sub-custom-event={onTypeSubCustomEvent}
  onspecial-event={onSpecialEvent}
  ontemplate-result-custom-event={onTemplateResultCustomEvent}
>
  {#if children}
    {@render children()}
  {/if}
</element-events>
