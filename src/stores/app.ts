import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')
  const openaiApiKey = ref(localStorage.getItem('openaiApiKey') ?? '')

  function showSnackbar(text: string, color = 'success') {
    snackbarText.value = text
    snackbarColor.value = color
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
    darkMode,
    openaiApiKey,
    showSnackbar,
    toggleDarkMode,
    setOpenaiApiKey,
    clearOpenaiApiKey,
  }
})
