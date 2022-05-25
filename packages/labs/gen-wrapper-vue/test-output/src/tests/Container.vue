<script setup lang="ts">
import ElementA from '@lit-internal/test-element-a-vue/ElementA.js';

const props = defineProps<{foo?: string}>();
</script>

<template>
  <header>Container</header>
  <ElementA :foo="foo" />
</template>
