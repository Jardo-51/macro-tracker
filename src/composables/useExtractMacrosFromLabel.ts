import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { extractMacrosFromLabelImage, type LabelExtractResult } from '@/services/openai'

export function useExtractMacrosFromLabel() {
  const appStore = useAppStore()
  const extracting = ref(false)

  async function extract(
    imageDataUrl: string,
    onSuccess: (result: LabelExtractResult) => void,
  ) {
    extracting.value = true
    try {
      const result = await extractMacrosFromLabelImage(imageDataUrl, appStore.openaiApiKey)
      onSuccess(result)
      appStore.showSnackbar('Macros filled from label', 'success')
    } catch (e: any) {
      appStore.showSnackbar(e.message || 'Label scan failed', 'error')
    } finally {
      extracting.value = false
    }
  }

  return { extracting, extract }
}
