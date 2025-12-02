
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-slots.js';
      import { setProperties } from "$lib/util.js";
      
      
      export interface Props {
     class?: string;
     style?: string;
     mainDefault?: string
   }
      export interface Events {
    
  }
      const { class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-slots 
    use:setProperties={props}
    class={className}
    style={style}
     >
      
    </element-slots>