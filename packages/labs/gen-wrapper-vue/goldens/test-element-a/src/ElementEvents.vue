<script lang="ts">
export type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
export type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
export type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {TemplateResult} from 'lit';
</script>
<script setup lang="ts">
import {h, useSlots} from 'vue';
import {
  assignSlotNodes,
  Slots,
  vProps,
} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-events.js';
import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
import {TemplateResult} from 'lit';

export interface Props {
  foo?: string | undefined;
}

const props = defineProps<Props>();

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
  const staticProps = {
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

  return h('element-events', staticProps, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-props="props" /></template>
