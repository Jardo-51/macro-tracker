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
    <CropImageDialog
      v-model="cropOpen"
      :image-data-url="pendingDataUrl"
      @cropped="onCropped"
    />
  </template>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { resizeAndEncodeImage } from '@/utils/imageResize'
  import CropImageDialog from './CropImageDialog.vue'

  defineProps<{ disabled: boolean; extracting: boolean }>()
  const emit = defineEmits<{ picked: [imageDataUrl: string] }>()

  const appStore = useAppStore()
  const fileInput = ref<HTMLInputElement | null>(null)
  const cropOpen = ref(false)
  const pendingDataUrl = ref('')

  function openPicker() {
    fileInput.value?.click()
  }

  async function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      pendingDataUrl.value = await resizeAndEncodeImage(file)
      cropOpen.value = true
    } catch (err: any) {
      appStore.showSnackbar(err?.message || 'Could not read image', 'error')
    }
  }

  function onCropped(dataUrl: string) {
    emit('picked', dataUrl)
  }
</script>
