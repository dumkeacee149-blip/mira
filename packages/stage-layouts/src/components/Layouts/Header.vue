<script setup lang="ts">
import { ProfileSwitcherPopover } from '@proj-mira/stage-ui/components'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import HeaderAvatar from './HeaderAvatar.vue'
import HeaderLink from './HeaderLink.vue'
import ActionAbout from './InteractiveArea/Actions/About.vue'

const router = useRouter()
const { t } = useI18n()
const navSignals = [
  'stage.landing.nav.edition',
  'stage.landing.nav.mode',
  'stage.landing.nav.sync',
] as const

function handleNavigation() {
  router.push('/settings/mira-card')
}
</script>

<template>
  <header
    :class="[
      'mb-1 flex w-full items-center justify-between gap-3 rounded-full border border-[#d7e5f5]',
      'bg-white/74 px-2 py-2 text-slate-900 shadow-[0_18px_50px_rgba(119,150,191,0.14)] backdrop-blur-[22px]',
    ]"
  >
    <div :class="['min-w-0 flex flex-1 items-center gap-3']">
      <HeaderLink />

      <div :class="['hidden items-center gap-2 lg:flex']">
        <span
          v-for="signal in navSignals"
          :key="signal"
          :class="[
            'rounded-full border border-[#d9e5f4] bg-[#f8fbff] px-3 py-1.5 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-[#7690b2]',
          ]"
        >
          {{ t(signal) }}
        </span>
      </div>
    </div>

    <div :class="['flex items-center gap-2']">
      <ProfileSwitcherPopover @create="handleNavigation" @manage="handleNavigation" />
      <ActionAbout />
      <HeaderAvatar />
    </div>
  </header>
</template>
