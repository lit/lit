
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
  stuff?: Snippet;
  tabTitle0?: Snippet
}
      const {onAChanged, class: className, style, children, stuff, tabTitle0, ...props} = $props<Props & Events & Slots>();

    </script>
    <element-a
    use:setProperties={props}
    class={className}
    style={style}
    ona-changed={onAChanged} >
      
      {#if children}
        {@render children()}
      {/if}

      {#if stuff}
        <div slot="stuff" style="display: contents;">
          {@render stuff()}
        </div>
      {/if}

      {#if tabTitle0}
        <div slot="tab-title-0" style="display: contents;">
          {@render tabTitle0()}
        </div>
      {/if}
    </element-a>