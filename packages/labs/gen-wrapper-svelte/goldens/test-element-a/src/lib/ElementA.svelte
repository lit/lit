
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-a.js';
      import { setProperties } from './util.js';
      
      
      export interface Props {
     class?: string;
     style?: string;
     foo?: string | undefined
   }
      export interface Events {
    aChanged?: (event: CustomEvent<unknown>) => void
  }
      const {aChanged, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-a 
    use:setProperties={props}
    class={className}
    style={style}
    ona-changed={aChanged} >
      <slot />
<slot name="stuff" />
    </element-a>