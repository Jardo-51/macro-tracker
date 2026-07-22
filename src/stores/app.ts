import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { initAuth, isLoggedIn, login, logout, userName } from '@/services/auth'

export const useAppStore = defineStore('app', () => {
  const snackbar = ref(false)
  const snackbarText = ref('')
  const snackbarColor = ref('success')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')

  // AI features are gated behind a Keycloak login (replaces the old API key).
  const aiLoggedIn = computed(() => isLoggedIn.value)
  const aiUserName = computed(() => userName.value)
  void initAuth()

  function showSnackbar(text: string, color = 'success') {
    snackbarText.value = text
    snackbarColor.value = color
    snackbar.value = true
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    localStorage.setItem('darkMode', String(darkMode.value))
  }

  function loginForAi() {
    return login()
  }

  async function logoutFromAi() {
    await logout()
    showSnackbar('Logged out')
  }

  return {
    snackbar,
    snackbarText,
    snackbarColor,
    darkMode,
    aiLoggedIn,
    aiUserName,
    showSnackbar,
    toggleDarkMode,
    loginForAi,
    logoutFromAi,
  }
})
