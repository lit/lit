<script setup lang="ts">
import ElementSlots from '@lit-internal/test-element-a-vue/ElementSlots.js';
</script>

<template>
  <header>Slot Container</header>
  <ElementSlots>
    <template #header>
      <div id="header1">Header1</div>
      <div id="header2">Header2</div>
    </template>
    <template #footer>Footer</template>
    Default
  </ElementSlots>
</template>
