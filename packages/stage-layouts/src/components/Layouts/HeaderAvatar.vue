<script setup lang="ts">
import { errorMessageFrom } from '@moeru/std'
import { listSessions, signOut } from '@proj-mira/stage-ui/libs/auth'
import { useAuthStore } from '@proj-mira/stage-ui/stores/auth'
import { onClickOutside, useMediaQuery } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()
const { isAuthenticated, user } = storeToRefs(authStore)

const isCompactHeader = useMediaQuery('(max-width: 640px)')

const userName = computed(() => user.value?.name)
const userAvatar = computed(() => user.value?.image)
const showDropdown = ref(false)
const dropdownRef = ref(null)
const iconButtonClass = [
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e5f4]',
  'bg-white/86 text-[#6d86a8] shadow-[0_18px_38px_rgba(119,150,191,0.12)] backdrop-blur-[22px]',
  'transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd3ea] hover:bg-white hover:text-slate-900',
]
const triggerButtonClass = [
  'flex items-center gap-2 rounded-full border border-[#d9e5f4] bg-white/86 px-1 py-1 pl-1 pr-3',
  'text-slate-700 shadow-[0_18px_38px_rgba(119,150,191,0.12)] backdrop-blur-[22px]',
  'transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd3ea] hover:bg-white hover:text-slate-900',
]
const dropdownPanelClass = [
  'absolute right-0 top-full z-50 mt-3 w-64 origin-top-right rounded-[1.4rem] border border-[#d9e5f4]',
  'bg-white/96 p-2 text-slate-900 shadow-[0_24px_80px_rgba(119,150,191,0.18)] backdrop-blur-[24px]',
]

onClickOutside(dropdownRef, () => {
  showDropdown.value = false
})

function handleLogout() {
  signOut()
}

async function handleListSessions() {
  try {
    const { data: sessions } = await listSessions()
    if (sessions) {
      toast.success(`You have ${sessions.length} active sessions.`)
    }
  }
  catch (error) {
    toast.error(errorMessageFrom(error) ?? 'An unknown error occurred')
  }
}
</script>

<template>
  <div :class="['flex items-center gap-2']">
    <!-- Non-authenticated: Settings & Login -->
    <!-- NOTICE: The avatar is stored in the localstorage, it will be shown at the first time of the page load, so we do not need the skeleton loading here -->
    <template v-if="!isAuthenticated">
      <RouterLink
        title="Settings"
        to="/settings"
        :class="iconButtonClass"
      >
        <div class="i-solar:settings-minimalistic-bold-duotone text-lg" />
      </RouterLink>

      <template v-if="isCompactHeader">
        <button
          title="Login"
          type="button"
          :class="iconButtonClass"
          @click="authStore.isLoginDrawerOpen = true"
        >
          <div class="i-solar:user-bold-duotone text-lg" />
        </button>
      </template>
      <template v-else>
        <RouterLink
          :title="isAuthenticated ? `Logged in as ${userName}` : 'Login'"
          to="/auth/login"
          :class="iconButtonClass"
        >
          <div class="i-solar:user-bold-duotone text-lg" />
        </RouterLink>
      </template>
    </template>

    <!-- Authenticated: Avatar Dropdown -->
    <div v-else ref="dropdownRef" class="relative">
      <button
        type="button"
        :class="[
          ...triggerButtonClass,
          showDropdown ? 'ring-1 ring-white/28' : '',
        ]"
        aria-haspopup="true"
        :aria-expanded="showDropdown ? 'true' : 'false'"
        @click="showDropdown = !showDropdown"
      >
        <img
          v-if="userAvatar"
          :src="userAvatar"
          class="h-8 w-8 rounded-full object-cover ring-2 ring-white/40"
        >
        <div
          v-else
          :class="[
            'flex h-8 w-8 items-center justify-center rounded-full bg-[#eff5ff] text-[#6d86a8] ring-2 ring-[#dbe7f5]',
          ]"
        >
          <div class="i-solar:user-bold-duotone text-base" />
        </div>

        <span v-if="userName" class="max-w-[100px] truncate text-sm text-slate-700 font-medium hidden sm:block">
          {{ userName }}
        </span>
        <div
          class="i-solar:alt-arrow-down-linear text-[#8aa0bb] transition-transform duration-200"
          :class="{ 'rotate-180': showDropdown }"
        />
      </button>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <div
          v-if="showDropdown"
          :class="dropdownPanelClass"
        >
          <div class="border-b border-[#e6edf7] px-3 py-3">
            <p class="text-xs text-[#88a0bc]">
              Signed in as
            </p>
            <p class="truncate text-sm text-slate-900 font-medium">
              {{ userName }}
            </p>
          </div>

          <div class="border-b border-[#e6edf7] py-2">
            <button
              class="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-[#f4f9ff] hover:text-slate-900"
              @click="handleListSessions"
            >
              <div class="i-solar:devices-bold-duotone text-lg text-[#89a0bc] transition group-hover:text-slate-900" />
              Active Sessions
            </button>

            <RouterLink
              to="/settings"
              class="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-[#f4f9ff] hover:text-slate-900"
              @click="showDropdown = false"
            >
              <div class="i-solar:settings-minimalistic-bold-duotone text-lg text-[#89a0bc] transition group-hover:text-slate-900" />
              Settings
            </RouterLink>
          </div>

          <div class="py-2">
            <button
              class="group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
              @click="handleLogout"
            >
              <div class="i-solar:logout-3-bold-duotone text-lg transition group-hover:text-red-100" />
              Logout
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
