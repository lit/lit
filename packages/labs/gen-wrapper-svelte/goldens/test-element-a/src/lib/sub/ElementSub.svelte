
  <script lang="ts">
    
      import '@lit-internal/test-element-a/sub/element-sub.js';
      import { setProperties } from './util.js';
      
      
      export interface Props {
     class?: string;
     style?: string;
     foo?: string | undefined
   }
      export interface Events {
    subChanged?: (event: CustomEvent<unknown>) => void
  }
      const {subChanged, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-sub 
    use:setProperties={props}
    class={className}
    style={style}
    onsub-changed={subChanged} >
      <slot />
<slot name="stuff" />
    </element-sub>