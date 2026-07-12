import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  function showSnackbar(text: string, color = 'success', action: SnackbarAction | null = null) {
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
