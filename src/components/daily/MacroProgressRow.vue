<template>
  <div class="d-flex justify-space-between text-body-2 mb-1">
    <span>{{ label }}</span>
    <span>
      {{ value }}{{ unit }} / {{ goal }}{{ unit }} ({{ percent }}%)
    </span>
  </div>
  <v-progress-linear
    :model-value="Math.min(100, percent)"
    :color="color"
    height="12"
    rounded
  />
</template>

<script lang="ts" setup>
  defineProps<{
    label: string
    value: number
    goal: number
    unit: string
    color: string
    percent: number
  }>()
</script>
