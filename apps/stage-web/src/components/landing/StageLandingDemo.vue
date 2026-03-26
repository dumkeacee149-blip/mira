<script setup lang="ts">
import type { CSSProperties } from 'vue'

import type { LandingStep } from './types'

import { WidgetStage } from '@proj-mira/stage-ui/components/scenes'
import { RouterLink } from 'vue-router'

defineProps<{
  actionLabel: string
  badges: string[]
  caption: string
  eyebrow: string
  focusAt: { x: number, y: number }
  isPaused?: boolean
  scale: number
  stageXOffset: string
  stageYOffset: string
  stickyStageStyle: CSSProperties
  steps: LandingStep[]
  title: string
}>()
</script>

<template>
  <section id="demo" :class="['scroll-section px-4 py-10 md:px-8 md:py-16']">
    <div :class="['mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(28rem,1fr)] lg:items-start']">
      <div :class="['space-y-4']">
        <article
          v-for="(step, index) in steps"
          :key="step.title"
          :class="[
            'rounded-[2rem] border border-white/10 bg-[#0b1424]/88 px-5 py-5 text-white backdrop-blur-[22px]',
            'shadow-[0_22px_60px_rgba(7,17,31,0.16)] md:px-7 md:py-7',
          ]"
        >
          <div :class="['flex items-start gap-4']">
            <span
              :class="[
                'mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm font-semibold text-[#6ee7dc]',
              ]"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>

            <div>
              <h3 :class="['text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl']">
                {{ step.title }}
              </h3>
              <p :class="['mt-3 max-w-[34rem] text-sm leading-7 text-white/68 md:text-base md:leading-8']">
                {{ step.body }}
              </p>
            </div>
          </div>
        </article>
      </div>

      <div :class="['lg:sticky lg:top-24']">
        <div
          :class="[
            'relative overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#08111f] px-5 py-5 text-white shadow-[0_40px_110px_rgba(7,17,31,0.24)]',
            'md:px-7 md:py-7',
          ]"
        >
          <div :class="['absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(110,231,220,0.14),_transparent_32%),radial-gradient(circle_at_78%_22%,rgba(255,133,87,0.18),transparent_20%)]']" />
          <div :class="['relative z-10 flex items-start justify-between gap-4']">
            <div>
              <p :class="['text-sm uppercase tracking-[0.34em] text-[#6ee7dc]/70']">
                {{ eyebrow }}
              </p>
              <h3 :class="['mt-4 max-w-[18ch] text-3xl font-semibold tracking-[-0.05em] md:text-4xl']">
                {{ title }}
              </h3>
            </div>
            <RouterLink
              to="/stage"
              :class="[
                'shrink-0 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/84 transition duration-300 hover:bg-white/16',
              ]"
            >
              {{ actionLabel }}
            </RouterLink>
          </div>

          <div
            :class="[
              'relative mt-8 overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]',
            ]"
            :style="stickyStageStyle"
          >
            <WidgetStage
              :class="['relative min-h-[28rem] w-full md:min-h-[34rem]']"
              :paused="isPaused ?? true"
              :focus-at="focusAt"
              :x-offset="stageXOffset"
              :y-offset="stageYOffset"
              :scale="scale"
            />

            <div :class="['absolute left-4 right-4 top-4 flex flex-wrap gap-2']">
              <span
                v-for="badge in badges"
                :key="badge"
                :class="['rounded-full border border-white/10 bg-slate-950/42 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/70']"
              >
                {{ badge }}
              </span>
            </div>

            <div :class="['absolute inset-x-4 bottom-4 rounded-[1.4rem] border border-white/10 bg-slate-950/72 px-4 py-4 text-sm leading-7 text-white/78 backdrop-blur-xl']">
              {{ caption }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
