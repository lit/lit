
  <script lang="ts">
    
      import '@lit-internal/test-element-a/element-without-props.js';
      
      
      export interface Props {
     
   }
      export interface Events {
    
  }
      const props = $props<{...Props, ...Events}>();

    </script>
    <element-without-props {...props} >
      
    </element-without-props>