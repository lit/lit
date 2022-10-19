<script setup lang="ts">
import {h, useSlots, reactive} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-events.js';
import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';

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
  (e: 'string-custom-event', payload: string): void;
  (e: 'number-custom-event', payload: number): void;
  (e: 'my-detail-custom-event', payload: MyDetail): void;
  (e: 'event-subclass', payload: EventSubclass): void;
  (e: 'special-event', payload: SpecialEvent): void;
}>();

const slots = useSlots();

const render = () => {
  const eventProps = {
    onStringCustomEvent: (event: CustomEvent<string>) =>
      emit('string-custom-event', event.detail as string),
    onNumberCustomEvent: (event: CustomEvent<number>) =>
      emit('number-custom-event', event.detail as number),
    onMyDetailCustomEvent: (event: CustomEvent<MyDetail>) =>
      emit('my-detail-custom-event', event.detail as MyDetail),
    onEventSubclass: (event: EventSubclass) =>
      emit('event-subclass', event as EventSubclass),
    onSpecialEvent: (event: SpecialEvent) =>
      emit('special-event', event as SpecialEvent),
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
