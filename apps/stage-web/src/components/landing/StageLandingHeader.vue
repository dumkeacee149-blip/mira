<script setup lang="ts">
import type { LandingSectionLink } from './types'

import { RouterLink } from 'vue-router'

import LogoAsset from '../../assets/logo.svg'

defineProps<{
  brandLabel: string
  brandTitle: string
  primaryActionLabel: string
  secondaryActionLabel: string
  sectionLinks: LandingSectionLink[]
}>()
</script>

<template>
  <header :class="['sticky top-0 z-50 px-4 pt-4 md:px-8']">
    <div
      :class="[
        'mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-white/10 bg-[#07111f]/78 px-3 py-3 text-white backdrop-blur-[26px]',
        'shadow-[0_18px_60px_rgba(7,17,31,0.22)]',
      ]"
    >
      <RouterLink to="/" :class="['flex items-center gap-3 rounded-full px-2 py-1.5 transition hover:bg-white/6']">
        <span :class="['grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8']">
          <img :src="LogoAsset" alt="MIRA logo" :class="['h-7 w-7']">
        </span>
        <span :class="['flex flex-col leading-none']">
          <span :class="['text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-[#6ee7dc]']">{{ brandTitle }}</span>
          <span :class="['mt-1 text-sm font-semibold tracking-[0.12em] text-white/88']">{{ brandLabel }}</span>
        </span>
      </RouterLink>

      <nav :class="['hidden items-center gap-2 md:flex']">
        <a
          v-for="link in sectionLinks"
          :key="link.href"
          :href="link.href"
          :class="['rounded-full px-4 py-2 text-sm text-white/68 transition duration-300 hover:bg-white/8 hover:text-white']"
        >
          {{ link.label }}
        </a>
      </nav>

      <div :class="['flex items-center gap-2']">
        <RouterLink
          to="/settings"
          :class="[
            'rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/82 transition duration-300 hover:-translate-y-0.5 hover:bg-white/14',
          ]"
        >
          {{ secondaryActionLabel }}
        </RouterLink>
        <RouterLink
          to="/stage"
          :class="[
            'rounded-full bg-[#ff8557] px-4 py-2 text-sm font-medium text-[#08111f] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff9972]',
          ]"
        >
          {{ primaryActionLabel }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>
