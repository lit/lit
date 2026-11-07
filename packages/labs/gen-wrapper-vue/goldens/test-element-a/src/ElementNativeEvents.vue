<script lang="ts">
export type {NativeDetail} from '@lit-internal/test-element-a/element-native-events.js';
</script>
<script setup lang="ts">
import {h, useSlots, reactive} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-native-events.js';
import {NativeDetail} from '@lit-internal/test-element-a/element-native-events.js';

export interface Props {
  value?: number;
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
  (e: 'input', payload: CustomEvent<NativeDetail>): void;
  (e: 'value-changed', payload: CustomEvent<NativeDetail>): void;
}>();

const slots = useSlots() as Slots;

const render = () => {
  const eventProps = {
    onInput: (event: CustomEvent<NativeDetail>) =>
      emit('input', event as CustomEvent<NativeDetail>),
    onValueChanged: (event: CustomEvent<NativeDetail>) =>
      emit('value-changed', event as CustomEvent<NativeDetail>),
  };
  const props = eventProps as typeof eventProps & Props;

  for (const p in vueProps) {
    const v = vueProps[p as keyof Props];
    if (v !== undefined || hasRendered) {
      (props[p as keyof Props] as unknown) = v ?? defaults[p as keyof Props];
    }
  }

  hasRendered = true;

  return h('element-native-events', props, assignSlotNodes(slots));
};
</script>
<template><render v-defaults /></template>
