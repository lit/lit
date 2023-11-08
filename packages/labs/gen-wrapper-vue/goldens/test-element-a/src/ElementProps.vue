<script lang="ts">
export type {MyType} from '@lit-internal/test-element-a/element-props.js';
</script>
<script setup lang="ts">
import {h, useSlots} from 'vue';
import {
  assignSlotNodes,
  Slots,
  vProps,
} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-props.js';
import {MyType} from '@lit-internal/test-element-a/element-props.js';

export interface Props {
  aStr?: string;
  aNum?: number;
  aBool?: boolean;
  aStrArray?: string[];
  aMyType?: MyType;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'a-changed', payload: CustomEvent<unknown>): void;
}>();

const slots = useSlots();

const render = () => {
  const staticProps = {
    onAChanged: (event: CustomEvent<unknown>) =>
      emit('a-changed', event as CustomEvent<unknown>),
  };

  return h('element-props', staticProps, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-props="props" /></template>
