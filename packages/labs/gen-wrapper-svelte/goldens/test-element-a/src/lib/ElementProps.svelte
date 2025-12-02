
  <script lang="ts">
    export type {MyType} from '@lit-internal/test-element-a/element-props.js';
      import '@lit-internal/test-element-a/element-props.js';
      import { setProperties } from './util.js';
      import type {MyType} from '@lit-internal/test-element-a/element-props.js';
      
      export interface Props {
     class?: string;
     style?: string;
     aStr?: string;
     aNum?: number;
     aBool?: boolean;
     aStrArray?: string[];
     aMyType?: MyType
   }
      export interface Events {
    aChanged?: (event: CustomEvent<unknown>) => void
  }
      const {aChanged, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-props 
    use:setProperties={props}
    class={className}
    style={style}
    ona-changed={aChanged} >
      
    </element-props>