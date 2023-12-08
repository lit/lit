<script setup lang="ts">
import {h, useSlots} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-without-props.js';

export interface Props {}

const slots = useSlots();

const render = () => {
  const props = {} as Props;

  return h('element-without-props', props, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-defaults /></template>
