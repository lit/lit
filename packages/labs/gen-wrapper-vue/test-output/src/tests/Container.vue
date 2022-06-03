<script setup lang="ts">
import ElementA from '@lit-internal/test-element-a-vue/ElementA.js';

// TODO(sorvell): add an invalidate property type and test that it fails
// to type check.
const props = defineProps<{foo?: string}>();
</script>

<template>
  <header>Container</header>
  <ElementA :foo="foo" />
</template>
