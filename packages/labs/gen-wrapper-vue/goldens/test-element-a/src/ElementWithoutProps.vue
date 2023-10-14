<script setup lang="ts">
import {h, useSlots, reactive} from 'vue';
import {assignSlotNodes, Slots} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-without-props.js';

export interface Props {}

const vueProps = defineProps<Props>();

const defaults = reactive({} as Props);
const vDefaults = {};

let hasRendered = false;

const slots = useSlots();

const render = () => {
  const eventProps = {};

  const props = eventProps as typeof eventProps & Props;
  for (const p in vueProps) {
    const v = vueProps[p as keyof Props];
    if (v !== undefined || hasRendered) {
      (props[p as keyof Props] as unknown) = v ?? defaults[p as keyof Props];
    }
  }

  hasRendered = true;

  return h('element-without-props', props, assignSlotNodes(slots as Slots));
};
</script>
<template><render v-defaults /></template>
