
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-a.js';
      import { setProperties } from "$lib/util.js";
      
      
      export interface Props {
     class?: string;
     style?: string;
     foo?: string | undefined
   }
      export interface Events {
    onAChanged?: (event: CustomEvent<unknown>) => void
  }
      const {onAChanged, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-a 
    use:setProperties={props}
    class={className}
    style={style}
    ona-changed={onAChanged} >
      <slot />
<slot name="stuff" />
    </element-a>