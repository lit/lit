<script setup lang="ts">
import {h, useSlots} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-mixins.js';

export interface Props {}

const slots = useSlots() as Slots;

const render = () => {
  const eventProps = {};
  const props = eventProps as typeof eventProps & Props;

  return h('element-mixins', props, assignSlotNodes(slots));
};
</script>
<template><render /></template>
