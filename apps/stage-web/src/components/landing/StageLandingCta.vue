<script setup lang="ts">
import { RouterLink } from 'vue-router'

import LogoAsset from '../../assets/logo.svg'

defineProps<{
  description: string
  eyebrow: string
  primaryActionLabel: string
  secondaryActionLabel: string
  title: string
}>()
</script>

<template>
  <section :class="['scroll-section px-4 py-10 md:px-8 md:py-16']">
    <div
      :class="[
        'cta-shell relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] px-6 py-8 text-slate-950 md:px-10 md:py-12',
        'border border-[#f3d2bb] shadow-[0_26px_90px_rgba(135,63,24,0.14)]',
      ]"
    >
      <div :class="['pointer-events-none absolute inset-y-0 right-[-8rem] w-[26rem] rounded-full bg-[#6ee7dc]/30 blur-[110px]']" />
      <div :class="['pointer-events-none absolute left-[-5rem] top-[-4rem] h-[14rem] w-[14rem] rounded-full bg-[#ff8f63]/30 blur-[80px]']" />

      <div :class="['relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end']">
        <div>
          <div
            :class="[
              'inline-flex items-center gap-3 rounded-full border border-black/6 bg-white/54 px-4 py-2 backdrop-blur-xl',
            ]"
          >
            <img :src="LogoAsset" alt="MIRA logo" :class="['h-10 w-10 rounded-2xl shadow-[0_10px_24px_rgba(12,14,26,0.14)]']">
            <span :class="['text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-slate-600']">{{ eyebrow }}</span>
          </div>

          <h2 :class="['mt-6 max-w-[14ch] text-4xl leading-[1.02] font-semibold tracking-[-0.06em] md:text-6xl']">
            {{ title }}
          </h2>

          <p :class="['mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-xl md:leading-9']">
            {{ description }}
          </p>
        </div>

        <div :class="['flex flex-col gap-3 sm:flex-row lg:flex-col']">
          <RouterLink
            to="/stage"
            :class="[
              'inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900',
            ]"
          >
            {{ primaryActionLabel }}
          </RouterLink>

          <RouterLink
            to="/settings"
            :class="[
              'inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white/72 px-6 py-3 text-sm font-medium text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-white',
            ]"
          >
            {{ secondaryActionLabel }}
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cta-shell {
  background:
    radial-gradient(circle at 16% 18%, rgba(255, 255, 255, 0.76), transparent 24%),
    linear-gradient(135deg, #fdf4ea 0%, #f6e0d0 48%, #f8efe6 100%);
}
</style>
