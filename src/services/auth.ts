/**
 * OIDC auth for AI features, backed by Keycloak.
 *
 * The app works fully without logging in; auth is only needed for AI calls.
 * We request the `offline_access` scope so Keycloak issues an offline refresh
 * token that survives restarts, letting the user "log in once and forget" —
 * access tokens are then refreshed silently in the background. Tokens are
 * persisted in localStorage so the session is restored on the next visit.
 */
import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import { ref } from 'vue'

const userManager = new UserManager({
  authority: import.meta.env.VITE_KEYCLOAK_AUTHORITY ?? '',
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? '',
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid offline_access',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  monitorSession: false,
})

/** Reactive login state for gating AI UI. */
export const isLoggedIn = ref(false)
/** Display name of the logged-in user, if available. */
export const userName = ref<string | null>(null)

function syncUser(user: User | null) {
  const valid = !!user && !user.expired
  isLoggedIn.value = valid
  userName.value = valid ? (user.profile.preferred_username ?? user.profile.name ?? null) : null
}

userManager.events.addUserLoaded(user => syncUser(user))
userManager.events.addUserUnloaded(() => syncUser(null))
userManager.events.addAccessTokenExpired(() => syncUser(null))
userManager.events.addSilentRenewError(() => syncUser(null))

/** Restore any persisted session on app start. */
export async function initAuth(): Promise<void> {
  try {
    syncUser(await userManager.getUser())
  } catch {
    syncUser(null)
  }
}

/** Begin the redirect login flow, remembering where to return afterwards. */
export function login(): Promise<void> {
  return userManager.signinRedirect({
    state: { returnTo: window.location.pathname + window.location.search },
  })
}

/** Complete the redirect login flow; returns the path to navigate back to. */
export async function handleCallback(): Promise<string | undefined> {
  const user = await userManager.signinRedirectCallback()
  syncUser(user)
  return (user.state as { returnTo?: string } | undefined)?.returnTo
}

/** Log out locally (clears the stored offline token). */
export async function logout(): Promise<void> {
  await userManager.removeUser()
  syncUser(null)
}

/**
 * Return a valid access token, silently refreshing it if expired.
 * Throws if the user is not (or no longer) authenticated.
 */
export async function getAccessToken(): Promise<string> {
  let user = await userManager.getUser()
  if (!user || user.expired) {
    try {
      user = await userManager.signinSilent()
    } catch {
      user = null
    }
  }
  if (!user?.access_token) {
    throw new Error('Not logged in. Log in from Settings to use AI features.')
  }
  return user.access_token
}
