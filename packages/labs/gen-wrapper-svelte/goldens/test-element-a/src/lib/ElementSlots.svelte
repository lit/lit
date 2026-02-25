
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-slots.js';
      import { setProperties } from "$lib/util.js";
      
      import type { Snippet } from 'svelte';

      export interface Props {
     class?: string;
     style?: string;
     mainDefault?: string;
     tabs?: { id: string; title: string; }[]
   }
      export interface Events {
    
  }
      export interface Slots {
  tabIcon?: Snippet<[any]>
}
      const { class: className, style, tabIcon, ...props} = $props<Props & Events & Slots>();

    </script>
    <element-slots
    use:setProperties={props}
    class={className}
    style={style}
     >
      
      {#if tabs && tabIcon}
        {#each tabs as item}
          <div slot="tab-{item.id}-icon">
            {@render tabIcon(item)}
          </div>
        {/each}
      {/if}
    </element-slots>