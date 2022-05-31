<script setup lang="ts">
import {h, useSlots} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-a.js';

const props = defineProps<{
  foo?: string | undefined;
}>();

const emit = defineEmits<{
  (e: 'a-changed', payload: unknown): void;
}>();

const slots = useSlots();

const render = () =>
  h(
    'element-a',
    {
      ...props,
      onAChanged: (event: CustomEvent<unknown>) =>
        emit('a-changed', (event.detail || event) as unknown),
    },
    assignSlotNodes(slots as Slots)
  );
</script>
<template><render /></template>
