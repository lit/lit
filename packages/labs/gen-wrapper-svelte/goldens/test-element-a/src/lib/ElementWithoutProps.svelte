
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-without-props.js';
      import { setProperties } from "$lib/util.js";
      
      
      export interface Props {
     class?: string;
     style?: string;
     
   }
      export interface Events {
    
  }
      const { class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-without-props 
    use:setProperties={props}
    class={className}
    style={style}
     >
      
    </element-without-props>