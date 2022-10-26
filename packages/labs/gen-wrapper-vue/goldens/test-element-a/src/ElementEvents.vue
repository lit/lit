<script lang="ts">
export type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
export type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
export type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {TemplateResult} from 'lit';
</script>
<script setup lang="ts">
import {h, useSlots, reactive} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-events.js';
import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
import {TemplateResult} from 'lit';

export interface Props {
  foo?: string | undefined;
}

const vueProps = defineProps<Props>();

const defaults = reactive({} as Props);
const vDefaults = {
  created(el: any) {
    for (const p in vueProps) {
      defaults[p as keyof Props] = el[p];
    }
  },
};

let hasRendered = false;

const emit = defineEmits<{
  (e: 'string-custom-event', payload: CustomEvent<string>): void;
  (e: 'number-custom-event', payload: CustomEvent<number>): void;
  (e: 'my-detail-custom-event', payload: CustomEvent<MyDetail>): void;
  (e: 'event-subclass', payload: EventSubclass): void;
  (e: 'special-event', payload: SpecialEvent): void;
  (
    e: 'template-result-custom-event',
    payload: CustomEvent<TemplateResult>
  ): void;
}>();

const slots = useSlots();

const render = () => {
  const eventProps = {
    onStringCustomEvent: (event: CustomEvent<string>) =>
      emit('string-custom-event', event as CustomEvent<string>),
    onNumberCustomEvent: (event: CustomEvent<number>) =>
      emit('number-custom-event', event as CustomEvent<number>),
    onMyDetailCustomEvent: (event: CustomEvent<MyDetail>) =>
      emit('my-detail-custom-event', event as CustomEvent<MyDetail>),
    onEventSubclass: (event: EventSubclass) =>
      emit('event-subclass', event as EventSubclass),
    onSpecialEvent: (event: SpecialEvent) =>
      emit('special-event', event as SpecialEvent),
    onTemplateResultCustomEvent: (event: CustomEvent<TemplateResult>) =>
      emit(
        'template-result-custom-event',
        event as CustomEvent<TemplateResult>
      ),
  };

  const props = eventProps as typeof eventProps & Props;
  for (const p in vueProps) {
    const v = vueProps[p as keyof Props];
    if (v !== undefined || hasRendered) {
      (props[p as keyof Props] as unknown) = v ?? defaults[p as keyof Props];
    }
  }

  hasRendered = true;

  return h('element-events', props, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-defaults /></template>
