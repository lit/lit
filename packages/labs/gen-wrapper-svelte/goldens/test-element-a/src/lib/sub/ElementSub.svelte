
  <script lang="ts">
    
      import '@lit-internal/test-element-a/sub/element-sub.js';
      
      
      export interface Props {
     foo?: string | undefined
   }
      export interface Events {
    subChanged: (event: CustomEvent<unknown>) => void
  }
      const props = $props<{...Props, ...Events}>();

    </script>
    <element-sub {...props} >
      
        <slot />
      

      <slot name="stuff" />
    
    </element-sub>