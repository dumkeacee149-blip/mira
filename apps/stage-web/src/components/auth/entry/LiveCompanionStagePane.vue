<script setup lang="ts">
import { WidgetStage } from '@proj-mira/stage-ui/components/scenes'
import { useElementHover, useMouseInElement, usePreferredReducedMotion } from '@vueuse/core'
import { computed, shallowRef, useTemplateRef } from 'vue'

import { miraCharacterPortrait } from '../../../assets/mira-character'

const props = defineProps<{
  characterDescription: string
  characterGreeting: string
  characterName: string
  characterTagline: string
}>()

const previewRef = useTemplateRef<HTMLElement>('previewRef')
const stageState = shallowRef<'pending' | 'loading' | 'mounted'>('pending')
const preferredReducedMotion = usePreferredReducedMotion()
const isReducedMotion = computed(() => preferredReducedMotion.value === 'reduce')
const isHovered = useElementHover(previewRef)
const {
  elementHeight,
  elementWidth,
  elementX,
  elementY,
  isOutside,
} = useMouseInElement(previewRef)

const focusAt = computed(() => {
  const width = elementWidth.value || 1
  const height = elementHeight.value || 1
  const fallbackX = width / 2
  const fallbackY = height / 2

  return {
    x: isOutside.value ? fallbackX : elementX.value,
    y: isOutside.value ? fallbackY : elementY.value,
  }
})

const summaryCopy = computed(() => [
  {
    label: 'Persona',
    value: `${props.characterName} is tuned as a quiet, attentive partner.`,
  },
  {
    label: 'Memory',
    value: 'Provider, model, and chat history stay inside one entry surface.',
  },
  {
    label: 'Flow',
    value: 'Hover the stage, then move straight into the dialog console.',
  },
])

const activeCaption = computed(() => {
  if (isHovered.value)
    return props.characterGreeting || props.characterTagline

  return props.characterTagline || props.characterDescription
})
</script>

<template>
  <section
    :class="[
      'relative overflow-hidden rounded-[2rem] border border-[#d8ecf9] bg-white/68 shadow-[0_32px_100px_rgba(142,181,214,0.18)] backdrop-blur-[24px]',
    ]"
  >
    <div :class="['pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(236,245,255,0.95),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(230,242,255,0.82),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,251,255,0.92))]']" />
    <div :class="['pointer-events-none absolute inset-0 studio-grid opacity-90']" />

    <div :class="['relative z-10 flex min-h-[36rem] flex-col px-5 pb-5 pt-6 md:px-8 md:pb-8 md:pt-8']">
      <div :class="['flex flex-wrap items-center justify-between gap-3']">
        <div>
          <p :class="['text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#7ea0bf]']">
            Live Companion Surface
          </p>
          <h2 :class="['mt-3 text-3xl leading-[0.94] font-semibold tracking-[-0.06em] text-slate-950 md:text-[3.6rem]']">
            {{ characterName }} keeps the room soft and focused.
          </h2>
        </div>

        <div
          :class="[
            'inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/78 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#6f8cad] shadow-[0_12px_36px_rgba(125,164,200,0.12)]',
          ]"
        >
          <span
            :class="[
              'h-2.5 w-2.5 rounded-full transition duration-300',
              isHovered ? 'bg-[#74c9ff] shadow-[0_0_18px_rgba(116,201,255,0.9)]' : 'bg-[#c9daea]',
            ]"
          />
          {{ isHovered ? 'Stage Awake' : 'Hover To Wake' }}
        </div>
      </div>

      <div :class="['mt-8 grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)] lg:items-end']">
        <div :class="['hidden gap-4 lg:grid']">
          <article
            v-for="item in summaryCopy"
            :key="item.label"
            :class="[
              'rounded-[1.6rem] border border-white/80 bg-white/74 px-5 py-4 shadow-[0_18px_42px_rgba(154,187,216,0.12)] backdrop-blur-[18px]',
            ]"
          >
            <p :class="['text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#87a4c2]']">
              {{ item.label }}
            </p>
            <p :class="['mt-3 text-sm leading-7 text-slate-700']">
              {{ item.value }}
            </p>
          </article>
        </div>

        <div
          ref="previewRef"
          :class="[
            'relative flex min-h-[30rem] items-end justify-center overflow-hidden rounded-[2rem] border border-[#d5e9f8] bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(233,245,255,0.86))] px-4 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]',
          ]"
        >
          <div :class="['pointer-events-none absolute inset-0 stage-grid-overlay']" />
          <div :class="['pointer-events-none absolute left-[10%] top-[20%] h-16 w-16 rounded-full bg-[#edd7ff]/55 blur-[24px]']" />
          <div :class="['pointer-events-none absolute right-[12%] top-[26%] h-18 w-18 rounded-full bg-[#d5f4ff]/70 blur-[26px]']" />
          <div :class="['pointer-events-none absolute bottom-[14%] left-[12%] h-22 w-22 rounded-full bg-white/90 blur-[34px]']" />

          <div
            :class="[
              'absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/85 bg-white/78 px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-[#6f8cad] md:left-6 md:top-6',
            ]"
          >
            <span :class="['h-2 w-2 rounded-full bg-[linear-gradient(135deg,#b58cff,#7aceff)]']" />
            {{ characterName }}
          </div>

          <WidgetStage
            v-model:state="stageState"
            :class="[
              'h-full w-full transition-opacity duration-500',
              stageState === 'mounted' ? 'opacity-100' : 'opacity-0',
            ]"
            :paused="isReducedMotion"
            :focus-at="focusAt"
            :scale="0.92"
            x-offset="1%"
            y-offset="-8%"
          />

          <img
            :src="miraCharacterPortrait"
            :alt="characterName"
            :class="[
              'pointer-events-none absolute inset-0 h-full w-full object-contain px-3 transition-opacity duration-500',
              stageState === 'mounted' ? 'opacity-0' : 'opacity-100',
            ]"
          >

          <div
            :class="[
              'absolute inset-x-4 bottom-4 rounded-[1.4rem] border border-white/82 bg-white/78 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_16px_42px_rgba(140,173,205,0.16)] backdrop-blur-[18px] md:inset-x-6 md:bottom-6',
            ]"
          >
            {{ activeCaption }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.studio-grid {
  background-image:
    linear-gradient(rgb(206 226 242 / 0.62) 1px, transparent 1px),
    linear-gradient(90deg, rgb(206 226 242 / 0.62) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgb(255 255 255 / 0.92), rgb(255 255 255 / 0.08));
}

.stage-grid-overlay {
  background-image:
    linear-gradient(rgb(188 216 238 / 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgb(188 216 238 / 0.6) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(180deg, rgb(0 0 0 / 0.72), rgb(0 0 0 / 0.24));
}
</style>
