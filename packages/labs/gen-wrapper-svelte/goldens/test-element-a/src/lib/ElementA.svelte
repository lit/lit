
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-a.js';
      import { setProperties } from "$lib/util.js";
      
      import type { Snippet } from 'svelte';

      export interface Props {
     class?: string;
     style?: string;
     foo?: string | undefined
   }
      export interface Events {
    onAChanged?: (event: CustomEvent<unknown>) => void
  }
      export interface Slots {
  children?: Snippet;
  stuff?: Snippet
}
      const {onAChanged, class: className, style, children, stuff, ...props} = $props<Props & Events & Slots>();

    </script>
    <element-a
    use:setProperties={props}
    class={className}
    style={style}
    ona-changed={onAChanged} >
      {@render children?.()}
<svelte:fragment slot="stuff">{@render stuff?.()}</svelte:fragment>
    </element-a>