
  <script lang="ts">
    export type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
export type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
export type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {TemplateResult} from 'lit';
      import '@lit-internal/test-element-a/element-events.js';
      import { setProperties } from './util.js';
      import type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
import type {TemplateResult} from 'lit';
      
      export interface Props {
     class?: string;
     style?: string;
     foo?: string | undefined
   }
      export interface Events {
    stringCustomEvent?: (event: CustomEvent<string>) => void;
    numberCustomEvent?: (event: CustomEvent<number>) => void;
    myDetailCustomEvent?: (event: CustomEvent<MyDetail>) => void;
    eventSubclass?: (event: EventSubclass) => void;
    specialEvent?: (event: SpecialEvent) => void;
    templateResultCustomEvent?: (event: CustomEvent<TemplateResult>) => void
  }
      const {stringCustomEvent, numberCustomEvent, myDetailCustomEvent, eventSubclass, specialEvent, templateResultCustomEvent, class: className, style, ...props} = $props<Props & Events>();

    </script>
    <element-events 
    use:setProperties={props}
    class={className}
    style={style}
    onstring-custom-event={stringCustomEvent}
   onnumber-custom-event={numberCustomEvent}
   onmy-detail-custom-event={myDetailCustomEvent}
   onevent-subclass={eventSubclass}
   onspecial-event={specialEvent}
   ontemplate-result-custom-event={templateResultCustomEvent} >
      
    </element-events>