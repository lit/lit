
  <script lang="ts">
    export type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
export type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
export type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {TemplateResult} from 'lit';
      import '@lit-internal/test-element-a/element-events.js';
      import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
import {TemplateResult} from 'lit';
      
      export interface Props {
     foo?: string | undefined
   }
      export interface Events {
    stringCustomEvent: (event: CustomEvent<string>) => void;
    numberCustomEvent: (event: CustomEvent<number>) => void;
    myDetailCustomEvent: (event: CustomEvent<MyDetail>) => void;
    eventSubclass: (event: EventSubclass) => void;
    specialEvent: (event: SpecialEvent) => void;
    templateResultCustomEvent: (event: CustomEvent<TemplateResult>) => void
  }
      const props = $props<{...Props, ...Events}>();

    </script>
    <element-events {...props} >
      
    </element-events>