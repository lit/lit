<script setup lang="ts">
import {h, useSlots} from 'vue';
import {
  assignSlotNodes,
  Slots,
  vProps,
} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-slots.js';

export interface Props {
  mainDefault?: string;
}

const props = defineProps<Props>();

const slots = useSlots();

const render = () => {
  const staticProps = {};

  return h('element-slots', staticProps, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-props="props" /></template>
