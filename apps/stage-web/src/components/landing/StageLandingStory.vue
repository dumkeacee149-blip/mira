<script setup lang="ts">
import type { LandingCard, LandingStat } from './types'

defineProps<{
  capabilityCards: LandingCard[]
  description: string
  eyebrow: string
  stats: LandingStat[]
  title: string
}>()
</script>

<template>
  <section id="story" :class="['scroll-section px-4 py-10 md:px-8 md:py-14']">
    <div
      :class="[
        'story-shell mx-auto overflow-hidden rounded-[3rem] border border-[#f1d1be] px-6 py-8 text-slate-950 md:px-9 md:py-10',
        'shadow-[0_24px_90px_rgba(120,64,26,0.12)]',
      ]"
    >
      <div :class="['grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end']">
        <div :class="['max-w-4xl']">
          <p :class="['text-sm uppercase tracking-[0.34em] text-slate-500']">
            {{ eyebrow }}
          </p>
          <h2 :class="['mt-4 text-4xl leading-tight font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl']">
            {{ title }}
          </h2>
          <p :class="['mt-5 max-w-3xl text-base leading-8 text-slate-700 md:text-xl md:leading-9']">
            {{ description }}
          </p>
        </div>

        <div :class="['grid gap-3 sm:grid-cols-3 lg:grid-cols-1']">
          <article
            v-for="stat in stats"
            :key="stat.label"
            :class="[
              'rounded-[1.5rem] border border-black/6 bg-white/66 px-4 py-4 backdrop-blur-xl',
            ]"
          >
            <p :class="['text-[0.68rem] uppercase tracking-[0.22em] text-slate-500']">
              {{ stat.label }}
            </p>
            <p :class="['mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950']">
              {{ stat.value }}
            </p>
          </article>
        </div>
      </div>

      <div :class="['mt-10 grid gap-4 lg:grid-cols-3']">
        <article
          v-for="(card, index) in capabilityCards"
          :key="card.id"
          :class="[
            'rounded-[2rem] border px-5 py-5 md:px-6 md:py-6',
            index === 0 && 'border-[#ffd2bd] bg-[linear-gradient(180deg,#fff5ee_0%,#ffe7da_100%)] text-slate-950',
            index === 1 && 'border-[#b6ece6] bg-[linear-gradient(180deg,#effcfa_0%,#daf8f3_100%)] text-slate-950',
            index === 2 && 'border-[#0e223c]/10 bg-[linear-gradient(180deg,#0d1628_0%,#13243f_100%)] text-white',
          ]"
        >
          <p
            :class="[
              'text-[0.68rem] uppercase tracking-[0.28em]',
              index === 2 ? 'text-[#6ee7dc]/72' : 'text-slate-500',
            ]"
          >
            {{ card.id }}
          </p>
          <h3 :class="['mt-4 text-2xl font-semibold tracking-[-0.03em] md:text-[2rem]']">
            {{ card.title }}
          </h3>
          <p
            :class="[
              'mt-4 text-sm leading-7 md:text-base md:leading-8',
              index === 2 ? 'text-white/74' : 'text-slate-700',
            ]"
          >
            {{ card.body }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.story-shell {
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.74), transparent 24%),
    linear-gradient(180deg, #fbefe5 0%, #f7e4d7 100%);
}
</style>
