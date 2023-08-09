<script setup lang="ts">
import ElementSub from '@lit-internal/test-element-a-vue/sub/ElementSub.js';

// TODO(sorvell): add an invalidate property type and test that it fails
// to type check.
const props = defineProps<{foo?: string}>();
</script>

<template>
  <header>Sub Container</header>
  <ElementSub :foo="foo" />
</template>
