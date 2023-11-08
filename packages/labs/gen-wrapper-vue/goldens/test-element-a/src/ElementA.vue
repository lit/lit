<script setup lang="ts">
import {h, useSlots} from 'vue';
import {
  assignSlotNodes,
  Slots,
  vProps,
} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-a.js';

export interface Props {
  foo?: string | undefined;
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

  return h('element-a', staticProps, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-props="props" /></template>
