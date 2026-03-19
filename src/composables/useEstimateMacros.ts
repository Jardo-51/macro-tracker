import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { estimateMacros } from '@/services/openai'
import type { Macros } from '@/types'

export function useEstimateMacros() {
  const appStore = useAppStore()
  const estimating = ref(false)

  async function estimate(name: string, onSuccess: (macros: Macros) => void) {
    estimating.value = true
    try {
      const macros = await estimateMacros(name, appStore.openaiApiKey)
      onSuccess(macros)
    } catch (e: any) {
      appStore.showSnackbar(e.message || 'Estimation failed', 'error')
    } finally {
      estimating.value = false
    }
  }

  return { estimating, estimate }
}
