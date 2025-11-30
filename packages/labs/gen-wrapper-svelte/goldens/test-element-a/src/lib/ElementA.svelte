
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-a.js';
      
      
      export interface Props {
     foo?: string | undefined
   }
      export interface Events {
    aChanged: (event: CustomEvent<unknown>) => void
  }
      const props = $props<{...Props, ...Events}>();

    </script>
    <element-a {...props} >
      
        <slot />
      

      <slot name="stuff" />
    
    </element-a>