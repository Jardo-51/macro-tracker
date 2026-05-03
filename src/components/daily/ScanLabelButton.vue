<template>
  <template v-if="appStore.openaiApiKey">
    <v-btn
      icon
      size="small"
      variant="tonal"
      color="primary"
      :disabled="disabled"
      :loading="extracting"
      @click="openPicker"
    >
      <v-icon>mdi-barcode-scan</v-icon>
      <v-tooltip activator="parent" location="top">Scan nutrition label</v-tooltip>
    </v-btn>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      capture="environment"
      style="display: none"
      @change="onFileChange"
    >
  </template>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { resizeAndEncodeImage } from '@/utils/imageResize'

  defineProps<{ disabled: boolean; extracting: boolean }>()
  const emit = defineEmits<{ picked: [imageDataUrl: string] }>()

  const appStore = useAppStore()
  const fileInput = ref<HTMLInputElement | null>(null)

  function openPicker() {
    fileInput.value?.click()
  }

  async function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const dataUrl = await resizeAndEncodeImage(file)
      emit('picked', dataUrl)
    } catch (err: any) {
      appStore.showSnackbar(err?.message || 'Could not read image', 'error')
    }
  }
</script>
