
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-slots.js';
      
      
      export interface Props {
     mainDefault?: string
   }
      export interface Events {
    
  }
      const props = $props<{...Props, ...Events}>();

    </script>
    <element-slots {...props} >
      
    </element-slots>