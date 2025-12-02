
  <script lang="ts">
    export type {MyType} from '@lit-internal/test-element-a/element-props.js';
      import '@lit-internal/test-element-a/element-props.js';
      import { setProperties } from "$lib/util.js";
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
    onAChanged?: (event: CustomEvent<unknown>) => void
  }
      const {onAChanged, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-props 
    use:setProperties={props}
    class={className}
    style={style}
    ona-changed={onAChanged} >
      
    </element-props>