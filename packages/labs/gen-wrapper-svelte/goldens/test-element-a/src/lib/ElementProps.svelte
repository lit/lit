
  <script lang="ts">
    export type {MyType} from '@lit-internal/test-element-a/element-props.js';
      import '@lit-internal/test-element-a/element-props.js';
      import {MyType} from '@lit-internal/test-element-a/element-props.js';
      
      export interface Props {
     aStr?: string;
     aNum?: number;
     aBool?: boolean;
     aStrArray?: string[];
     aMyType?: MyType
   }
      export interface Events {
    aChanged: (event: CustomEvent<unknown>) => void
  }
      const props = $props<{...Props, ...Events}>();

    </script>
    <element-props {...props} >
      
    </element-props>