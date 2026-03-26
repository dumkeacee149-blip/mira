<script setup lang="ts">
import type { LandingRouteCard } from './types'

import { RouterLink } from 'vue-router'

defineProps<{
  cards: LandingRouteCard[]
  continueLabel: string
  description: string
  eyebrow: string
  title: string
}>()
</script>

<template>
  <section id="routes" :class="['scroll-section px-4 py-10 md:px-8 md:py-14']">
    <div
      :class="[
        'mx-auto max-w-7xl rounded-[3rem] border border-white/10 bg-[#08111f] px-6 py-8 text-white md:px-9 md:py-10',
        'shadow-[0_28px_100px_rgba(7,17,31,0.2)]',
      ]"
    >
      <div :class="['max-w-3xl']">
        <p :class="['text-sm uppercase tracking-[0.34em] text-[#6ee7dc]/62']">
          {{ eyebrow }}
        </p>
        <h2 :class="['mt-4 text-4xl leading-tight font-semibold tracking-[-0.05em] md:text-6xl']">
          {{ title }}
        </h2>
        <p :class="['mt-5 text-base leading-8 text-white/68 md:text-xl md:leading-9']">
          {{ description }}
        </p>
      </div>

      <div :class="['mt-10 grid gap-4 lg:grid-cols-3']">
        <RouterLink
          v-for="(card, index) in cards"
          :key="card.title"
          :to="card.to"
          :class="[
            'group rounded-[2rem] border px-5 py-5 transition duration-300 hover:-translate-y-1 md:px-6 md:py-6',
            index === 0 && 'border-[#ff8557]/22 bg-[linear-gradient(180deg,rgba(255,133,87,0.18),rgba(255,133,87,0.06))] hover:border-[#ff8557]/38',
            index === 1 && 'border-[#6ee7dc]/22 bg-[linear-gradient(180deg,rgba(110,231,220,0.18),rgba(110,231,220,0.06))] hover:border-[#6ee7dc]/38',
            index === 2 && 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] hover:border-white/18',
          ]"
        >
          <p :class="['text-sm uppercase tracking-[0.28em] text-white/60']">
            {{ card.title }}
          </p>
          <h3 :class="['mt-4 text-2xl font-semibold tracking-[-0.04em]']">
            {{ card.action }}
          </h3>
          <p :class="['mt-4 text-sm leading-7 text-white/68']">
            {{ card.body }}
          </p>
          <div :class="['mt-8 inline-flex items-center gap-2 text-sm text-white/86']">
            {{ continueLabel }}
            <span :class="['i-lucide:arrow-right h-4 w-4 transition duration-300 group-hover:translate-x-1']" aria-hidden="true" />
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
