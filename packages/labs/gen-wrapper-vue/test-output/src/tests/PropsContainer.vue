<script lang="ts">
export let state = {
  aStr: 'a',
  aNum: 1111,
  aStrOrNum: 'b',
  aBool: true,
  aStrArray: ['111'],
  aMyType: {
    a: 'ma',
    b: -11,
    c: false,
    d: ['ma', 'mb'],
    e: 'me',
    strOrNum: 'mstrOrNum',
  },
};
</script>

<script setup lang="ts">
import {default as ElementProps} from '@lit-internal/test-element-props-vue/ElementProps.js';

const props = defineProps<{bag?: any}>();

state = Object.assign(
  {
    aStr: 'a',
    aNum: 1111,
    aStrOrNum: 'b',
    aBool: true,
    aStrArray: ['111'],
    aMyType: {
      a: 'ma',
      b: -11,
      c: false,
      d: ['ma', 'mb'],
      e: 'me',
      strOrNum: 'mstrOrNum',
    },
  },
  props.bag ?? null
);
</script>

<template>
  <header>Container</header>
  <ElementProps v-bind="state" />
</template>

<!-- <ElementProps
    :aStr="state.aStr"
    :aNum="state.aNum"
    :aStrOrNum="state.aStrOrNum"
    :aBool="state.aBool"
    :aStrArray="state.aStrArray"
    :aMyType="state.aMyType"
  /> -->
