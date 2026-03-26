<script setup lang="ts">
import type { CSSProperties } from 'vue'

import type { LandingCard, LandingStat } from './types'

import { RouterLink } from 'vue-router'

import BackgroundImage from '../../assets/backgrounds/fairy-forest.e17cbc2774.ko-fi.com.avif'
import CharacterFigure from '../../assets/mira-character'

defineProps<{
  capabilityCards: LandingCard[]
  description: string
  eyebrow: string
  heroDeviceStyle: CSSProperties
  previewBadges: string[]
  previewCaption: string
  previewFocusLabel: string
  primaryActionLabel: string
  secondaryActionLabel: string
  signals: LandingStat[]
  title: string
}>()
</script>

<template>
  <section
    :class="[
      'scroll-section px-4 pb-10 pt-6 md:px-8 md:pb-16 md:pt-10',
    ]"
  >
    <div :class="['mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1fr)] lg:items-center']">
      <div
        :class="[
          'hero-copy relative overflow-hidden rounded-[2.8rem] border border-[#f3d0bc] px-6 py-7 backdrop-blur-[22px]',
          'shadow-[0_28px_100px_rgba(126,63,24,0.14)] md:px-9 md:py-10',
        ]"
      >
        <div :class="['pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.78),_transparent_28%),linear-gradient(135deg,#fdf4ea_0%,#f7dfd1_56%,#f7efe8_100%)]']" />

        <div :class="['relative z-10']">
          <div
            :class="[
              'inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/72 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-slate-600',
            ]"
          >
            <span :class="['h-2 w-2 rounded-full bg-[#ff8557]']" />
            {{ eyebrow }}
          </div>

          <h1
            :class="[
              'mt-6 max-w-[11ch] text-5xl leading-[0.9] font-semibold tracking-[-0.075em] text-slate-950 md:text-7xl',
            ]"
          >
            {{ title }}
          </h1>

          <p :class="['mt-6 max-w-[38rem] text-base leading-8 text-slate-700 md:text-xl md:leading-9']">
            {{ description }}
          </p>

          <div :class="['mt-8 flex flex-wrap items-center gap-3']">
            <RouterLink
              to="/stage"
              :class="[
                'rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900',
              ]"
            >
              {{ primaryActionLabel }}
            </RouterLink>
            <a
              href="#story"
              :class="[
                'rounded-full border border-black/8 bg-white/62 px-6 py-3 text-sm font-medium text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:bg-white',
              ]"
            >
              {{ secondaryActionLabel }}
            </a>
          </div>

          <div :class="['mt-8 grid gap-3 sm:grid-cols-3']">
            <article
              v-for="signal in signals"
              :key="signal.label"
              :class="[
                'rounded-[1.4rem] border border-black/8 bg-white/62 px-4 py-4 backdrop-blur-xl',
              ]"
            >
              <p :class="['text-[0.68rem] uppercase tracking-[0.22em] text-slate-500']">
                {{ signal.label }}
              </p>
              <p :class="['mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 md:text-3xl']">
                {{ signal.value }}
              </p>
            </article>
          </div>
        </div>
      </div>

      <div
        :class="[
          'relative overflow-hidden rounded-[2.8rem] border border-[#09203a]/14 bg-[#08111f] p-5 text-white shadow-[0_36px_120px_rgba(7,17,31,0.24)] md:p-7',
        ]"
        :style="heroDeviceStyle"
      >
        <img
          :src="BackgroundImage"
          alt=""
          :class="['absolute inset-0 h-full w-full object-cover opacity-22 mix-blend-screen']"
        >
        <div :class="['absolute inset-0 bg-[linear-gradient(145deg,rgba(5,14,26,0.16),rgba(5,14,26,0.92))]']" />
        <div :class="['absolute inset-y-0 right-0 w-[60%] bg-[radial-gradient(circle_at_center,_rgba(110,231,220,0.22),_transparent_56%)]']" />
        <div :class="['absolute bottom-[-5rem] right-[-2rem] h-[18rem] w-[18rem] rounded-full bg-[#ff8557]/24 blur-[80px]']" />

        <div :class="['relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem]']">
          <div
            :class="[
              'relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl',
            ]"
          >
            <div :class="['relative h-[26rem] overflow-hidden rounded-[1.8rem] bg-[linear-gradient(180deg,#0e2038_0%,#091220_100%)] md:h-[34rem]']">
              <div :class="['absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,196,226,0.34),transparent_24%),radial-gradient(circle_at_56%_48%,rgba(236,72,153,0.18),transparent_22%),radial-gradient(circle_at_46%_56%,rgba(255,255,255,0.16),transparent_24%)]']" />
              <div :class="['absolute left-6 top-6 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.26em] text-white/70']">
                {{ previewFocusLabel }}
              </div>
              <div :class="['absolute right-6 top-6 flex flex-col gap-2']">
                <span
                  v-for="badge in previewBadges"
                  :key="badge"
                  :class="['rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/72']"
                >
                  {{ badge }}
                </span>
              </div>

              <div :class="['absolute inset-x-0 bottom-0 top-12 flex items-end justify-center']">
                <img
                  :src="CharacterFigure"
                  alt="MIRA avatar preview"
                  :class="['hero-character h-[96%] object-contain drop-shadow-[0_38px_64px_rgba(0,0,0,0.36)]']"
                >
              </div>

              <div :class="['absolute inset-x-6 bottom-6 rounded-[1.3rem] border border-white/10 bg-slate-950/62 px-4 py-4 text-sm text-white/82 backdrop-blur-xl']">
                {{ previewCaption }}
              </div>
            </div>
          </div>

          <div :class="['grid gap-4']">
            <article
              v-for="card in capabilityCards"
              :key="`${card.id}-hero`"
              :class="[
                'rounded-[1.6rem] border border-white/8 bg-white/8 px-4 py-4 backdrop-blur-xl',
              ]"
            >
              <p :class="['text-[0.68rem] uppercase tracking-[0.28em] text-[#6ee7dc]/72']">
                {{ card.id }}
              </p>
              <h2 :class="['mt-3 text-xl font-semibold tracking-[-0.03em]']">
                {{ card.title }}
              </h2>
              <p :class="['mt-3 text-sm leading-6 text-white/68']">
                {{ card.body }}
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-copy {
  animation: landing-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-character {
  animation: hero-float 6s ease-in-out infinite;
}

@keyframes landing-rise {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes hero-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-12px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .hero-character {
    animation: none;
  }
}
</style>
