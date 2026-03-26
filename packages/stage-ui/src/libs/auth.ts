import { createAuthClient } from 'better-auth/vue'

import { useAuthStore } from '../stores/auth'

export type OAuthProvider = 'google' | 'github'

function resolveServerUrl() {
  if (import.meta.env.VITE_SERVER_URL)
    return import.meta.env.VITE_SERVER_URL

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1')
      return 'http://localhost:3000'

    if (hostname.endsWith('.mira.local') && hostname !== 'api.mira.local')
      return `${protocol}//api.mira.local`
  }

  return import.meta.env.DEV ? 'http://localhost:3000' : 'https://api.mira.local'
}

export const SERVER_URL = resolveServerUrl()

export const authClient = createAuthClient({
  baseURL: SERVER_URL,
  credentials: 'include',
})

export async function fetchSession() {
  const { data } = await authClient.getSession()
  if (data) {
    const authStore = useAuthStore()

    authStore.user = data.user
    authStore.session = data.session
    return true
  }

  return false
}

export async function listSessions() {
  return await authClient.listSessions()
}

export async function signOut() {
  await authClient.signOut()

  const authStore = useAuthStore()
  authStore.user = undefined
  authStore.session = undefined
}

export async function signIn(provider: OAuthProvider) {
  return await authClient.signIn.social({
    provider,
    callbackURL: window.location.origin,
  })
}
