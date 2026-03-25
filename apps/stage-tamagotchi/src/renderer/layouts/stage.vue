<script setup lang="ts">
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { useTheme } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import { BRAND_UI } from '../../shared/brand'

const { isDark, toggleDark } = useTheme()
const settings = useSettings()
const route = useRoute()
const router = useRouter()

const { alwaysOnTop } = storeToRefs(settings)
const isHome = computed(() => route.path === '/' || route.path === '')

const quickActions = computed(() => [
  {
    label: 'Home',
    icon: 'i-solar:home-line-duotone',
    to: '/',
    key: 'home',
  },
  {
    label: 'Chat',
    icon: 'i-solar:chat-line-line-duotone',
    to: '/chat',
    key: 'chat',
  },
  {
    label: 'Widgets',
    icon: 'i-solar:widget-4-line-duotone',
    to: '/widgets',
    key: 'widgets',
  },
  {
    label: 'Settings',
    icon: 'i-solar:settings-minimalistic-outline',
    to: '/settings',
    key: 'settings',
  },
  {
    label: 'About',
    icon: 'i-solar:info-circle-line-duotone',
    to: '/about',
    key: 'about',
  },
])

const isActive = computed(() => (path: string) => {
  if (path === '/')
    return isHome.value

  return route.path.startsWith(path)
})

function go(path: string) {
  if (route.path !== path)
    void router.push(path)
}

function reloadApp() {
  window.location.reload()
}
</script>

<template>
  <div class="h-full w-full bg-neutral-950 text-neutral-100">
    <div class="mx-auto h-full w-full flex gap-3 p-3">
      <aside class="w-52 flex-shrink-0 border border-neutral-800 rounded-2xl bg-neutral-900/85 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl hidden lg:flex lg:flex-col lg:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
            <div class="size-8 rounded-full from-violet-500 to-fuchsia-500 bg-gradient-to-br p-2 text-white">
              <div i-solar:atom-2-bold-duotone />
            </div>
            <div>
              <p>{{ BRAND_UI.name }}</p>
              <p class="text-xs text-neutral-400">
                AI Stage Assistant
              </p>
            </div>
          </div>

          <nav class="mt-2 flex flex-col gap-1">
            <button
              v-for="action in quickActions"
              :key="action.key"
              class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all"
              :class="isActive(action.to)
                ? 'bg-primary-500/30 text-white shadow-inner shadow-primary-500/20'
                : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'"
              @click="go(action.to)"
            >
              <span :class="`${action.icon} text-lg`" />
              <span>{{ action.label }}</span>
            </button>
          </nav>
        </div>

        <div class="mt-4 rounded-xl bg-neutral-800/80 p-3 text-xs text-neutral-300">
          <p class="mb-1.5 flex items-center gap-2">
            <span class="size-2 rounded-full" :class="alwaysOnTop ? 'bg-emerald-400' : 'bg-neutral-500'" />
            Always On Top
          </p>
          <p class="text-[11px] text-neutral-500">
            {{ alwaysOnTop ? 'Pinned above other windows' : 'Normal window stacking' }}
          </p>
        </div>
      </aside>

      <div class="min-h-0 min-w-0 flex flex-1 flex-col border border-neutral-800 rounded-2xl bg-neutral-900/70 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <header class="mb-3 flex flex-wrap items-center justify-between gap-2 border border-neutral-800 rounded-xl bg-neutral-950/70 px-3 py-2 text-xs text-neutral-300 font-medium">
          <div class="flex items-center gap-2">
            <span :class="`${isDark ? 'text-white' : 'text-neutral-200'}`">{{ BRAND_UI.mainWindowTitle }}</span>
            <span class="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] text-neutral-300 tracking-[0.15em] uppercase">UI Refresh</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300">
              Online
            </div>
            <button class="border border-neutral-700 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-800" @click="toggleDark()">
              <span :class="isDark ? 'i-solar:moon-outline' : 'i-solar:sun-2-outline'" class="text-sm" />
            </button>
            <button
              class="border border-neutral-700 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-800"
              @click="reloadApp"
            >
              <span class="i-solar:refresh-linear text-sm" />
            </button>
            <RouterLink to="/settings" class="border border-neutral-700 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-800">
              <span class="i-solar:settings-minimalistic-outline text-sm" />
            </RouterLink>
          </div>
        </header>

        <main class="min-h-0 flex-1 border border-neutral-800 rounded-xl bg-black/25">
          <RouterView />
        </main>
      </div>

      <aside class="w-72 flex-shrink-0 border border-neutral-800 rounded-2xl bg-neutral-900/85 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl hidden xl:flex xl:flex-col">
        <p class="px-2 text-xs text-neutral-400 font-semibold tracking-[0.12em] uppercase">
          Status
        </p>
        <div class="mt-2 space-y-2">
          <div class="border border-neutral-700 rounded-xl bg-neutral-900/70 p-2">
            <p class="text-xs text-neutral-400">
              Current Build
            </p>
            <p class="text-sm text-neutral-100">
              Mira Desktop
            </p>
          </div>
          <div class="border border-neutral-700 rounded-xl bg-neutral-900/70 p-2">
            <p class="text-xs text-neutral-400">
              Quick Actions
            </p>
            <div class="mt-2 flex flex-col gap-2">
              <RouterLink to="/chat" class="border border-neutral-700 rounded-lg px-2 py-1 text-sm text-neutral-200 transition-colors hover:bg-neutral-800">
                Open Chat
              </RouterLink>
              <RouterLink to="/widgets" class="border border-neutral-700 rounded-lg px-2 py-1 text-sm text-neutral-200 transition-colors hover:bg-neutral-800">
                Open Widgets
              </RouterLink>
              <RouterLink to="/settings" class="border border-neutral-700 rounded-lg px-2 py-1 text-sm text-neutral-200 transition-colors hover:bg-neutral-800">
                Open Settings
              </RouterLink>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
