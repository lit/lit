
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-mixins.js';
      import { setProperties } from './util.js';
      
      
      export interface Props {
     class?: string;
     style?: string;
     
   }
      export interface Events {
    
  }
      const { class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-mixins 
    use:setProperties={props}
    class={className}
    style={style}
     >
      
    </element-mixins>