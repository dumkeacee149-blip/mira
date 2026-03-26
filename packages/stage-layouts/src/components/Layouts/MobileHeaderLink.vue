<script setup lang="ts">
import { useTheme } from '@proj-mira/ui'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import LogoDark from '../../assets/logo-dark.svg'
import Logo from '../../assets/logo.svg'

const { isDark: dark } = useTheme()
const { t } = useI18n()
</script>

<template>
  <RouterLink
    to="/"
    :class="[
      'group flex min-w-0 items-center gap-3 rounded-full px-1 py-1 pr-3 outline-none transition duration-300',
      'hover:bg-white/10',
    ]"
  >
    <span
      :class="[
        'grid h-10 w-10 place-items-center rounded-full border border-white/18 bg-white/12 shadow-[0_10px_20px_rgba(15,23,42,0.16)] backdrop-blur-xl',
      ]"
    >
      <template v-if="dark">
        <img :src="LogoDark" class="theme-colored h-6 w-6">
      </template>
      <template v-else>
        <img :src="Logo" class="theme-colored h-6 w-6">
      </template>
    </span>

    <span :class="['min-w-0 flex flex-col leading-none']">
      <span :class="['text-[0.58rem] font-medium uppercase tracking-[0.34em] text-white/58']">
        MIRA
      </span>
      <span :class="['mt-1 truncate text-xs font-semibold tracking-[0.14em] text-white']">
        {{ t('stage.landing.nav.edition') }}
      </span>
    </span>
  </RouterLink>
</template>

<style scoped>
.theme-colored {
  filter: hue-rotate(calc(var(--chromatic-hue, 0) * 1deg));
}
</style>
