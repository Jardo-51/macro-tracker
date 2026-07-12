import { defineStore } from 'pinia'
import { nextTick, ref } from 'vue'

export interface SnackbarAction {
  label: string
  handler: () => void
}

export const useAppStore = defineStore('app', () => {
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')
  const snackbarAction = ref<SnackbarAction | null>(null)
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')
  const openaiApiKey = ref(localStorage.getItem('openaiApiKey') ?? '')

  // Monotonic token so that if a newer showSnackbar call arrives while an
  // earlier one is suspended at `await nextTick()`, the stale continuation
  // bails instead of overwriting the newer message.
  let snackbarToken = 0

  async function showSnackbar(text: string, color = 'success', action: SnackbarAction | null = null) {
    const token = ++snackbarToken
    // Close and reopen so a message replacing a visible one gets a fresh
    // timeout instead of inheriting the remainder of the previous timer.
    if (snackbar.value) {
      snackbar.value = false
      await nextTick()
      if (token !== snackbarToken) return
    }
    snackbarText.value = text
    snackbarColor.value = color
    snackbarAction.value = action
    snackbar.value = true
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', String(darkMode.value))
  }

  function setOpenaiApiKey(key: string) {
    openaiApiKey.value = key
    localStorage.setItem('openaiApiKey', key)
  }

  function clearOpenaiApiKey() {
    openaiApiKey.value = ''
    localStorage.removeItem('openaiApiKey')
  }

  return {
    snackbar,
    snackbarText,
    snackbarColor,
    snackbarAction,
    darkMode,
    openaiApiKey,
    showSnackbar,
    toggleDarkMode,
    setOpenaiApiKey,
    clearOpenaiApiKey,
  }
})
