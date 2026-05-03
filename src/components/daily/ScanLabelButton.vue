<template>
  <template v-if="appStore.openaiApiKey">
    <v-btn
      icon
      size="small"
      variant="tonal"
      color="primary"
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
      style="display: none"
      @change="onFileChange"
    >
    <CropImageDialog
      v-model="cropOpen"
      :file="pendingFile"
      @cropped="onCropped"
    />
  </template>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import CropImageDialog from './CropImageDialog.vue'

  defineProps<{ extracting: boolean }>()
  const emit = defineEmits<{ picked: [imageDataUrl: string] }>()

  const appStore = useAppStore()
  const fileInput = ref<HTMLInputElement | null>(null)
  const cropOpen = ref(false)
  const pendingFile = ref<File | null>(null)

  function openPicker() {
    fileInput.value?.click()
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    input.value = ''
    if (!file) return
    pendingFile.value = file
    cropOpen.value = true
  }

  function onCropped(dataUrl: string) {
    emit('picked', dataUrl)
  }
</script>
