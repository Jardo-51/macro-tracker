<template>
  <v-btn
    v-if="appStore.openaiApiKey"
    icon
    size="small"
    variant="tonal"
    color="primary"
    :disabled="disabled"
    :loading="estimating"
    @click="$emit('click')"
  >
    <v-icon>mdi-auto-fix</v-icon>
    <v-tooltip activator="parent" location="top">Estimate macros with AI</v-tooltip>
  </v-btn>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/stores/app'

  defineProps<{ disabled: boolean; estimating: boolean }>()
  defineEmits<{ click: [] }>()

  const appStore = useAppStore()
</script>
