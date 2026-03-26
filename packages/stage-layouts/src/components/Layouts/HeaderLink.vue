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
      'group flex w-max items-center gap-3 rounded-full px-1 py-1 pr-4 text-nowrap outline-none transition duration-300',
      'hover:bg-[#f4f9ff]',
    ]"
  >
    <span
      :class="[
        'grid h-11 w-11 place-items-center rounded-full border border-[#d9e4f4] bg-white shadow-[0_10px_24px_rgba(119,150,191,0.16)] backdrop-blur-xl',
      ]"
    >
      <template v-if="dark">
        <img :src="LogoDark" class="theme-colored h-7 w-7">
      </template>
      <template v-else>
        <img :src="Logo" class="theme-colored h-7 w-7">
      </template>
    </span>

    <span :class="['flex flex-col leading-none']">
      <span :class="['text-[0.62rem] font-medium uppercase tracking-[0.34em] text-[#7b93b1]']">
        MIRA
      </span>
      <span :class="['mt-1 text-sm font-semibold tracking-[0.14em] text-slate-900']">
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
