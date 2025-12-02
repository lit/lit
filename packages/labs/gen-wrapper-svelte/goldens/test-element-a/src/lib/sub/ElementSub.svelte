
  <script lang="ts">
    
      import '@lit-internal/test-element-a/sub/element-sub.js';
      import { setProperties } from "$lib/util.js";
      
      
      export interface Props {
     class?: string;
     style?: string;
     foo?: string | undefined
   }
      export interface Events {
    onSubChanged?: (event: CustomEvent<unknown>) => void
  }
      const {onSubChanged, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-sub 
    use:setProperties={props}
    class={className}
    style={style}
    onsub-changed={onSubChanged} >
      <slot />
<slot name="stuff" />
    </element-sub>