<script setup lang="ts">
import type { CSSProperties } from 'vue'

import type { StageWorkspaceStat } from './types'

import { WidgetStage } from '@proj-mira/stage-ui/components/scenes'

defineProps<{
  actionFocusLabel: string
  actionSettingsLabel: string
  badges: string[]
  description: string
  eyebrow: string
  focusAt: { x: number, y: number }
  isPaused?: boolean
  note: string
  orbStyle: CSSProperties
  scale: number
  stageXOffset: string
  stageYOffset: string
  stats: StageWorkspaceStat[]
  title: string
}>()

const emit = defineEmits<{
  focus: []
  settings: []
}>()
</script>

<template>
  <section
    :class="[
      'relative flex h-full min-h-[42rem] flex-col overflow-hidden rounded-[2rem] border border-[#d6e4f5]',
      'bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(247,251,255,0.96))]',
      'shadow-[0_28px_100px_rgba(102,137,182,0.14)] backdrop-blur-[22px]',
    ]"
  >
    <div
      :class="[
        'pointer-events-none absolute inset-0',
        'bg-[radial-gradient(circle_at_top_left,_rgba(222,237,255,0.95),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(243,248,255,0.9),_transparent_32%)]',
      ]"
    />

    <div :class="['relative z-10 flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6 xl:p-7']">
      <div :class="['flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between']">
        <div :class="['space-y-3']">
          <p :class="['text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#6f88aa]']">
            {{ eyebrow }}
          </p>

          <div :class="['flex flex-wrap items-center gap-2']">
            <span
              v-for="badge in badges"
              :key="badge"
              :class="[
                'inline-flex items-center rounded-full border border-[#d8e4f5] bg-white/88 px-3 py-1.5',
                'text-[0.64rem] font-medium uppercase tracking-[0.22em] text-[#567197]',
              ]"
            >
              {{ badge }}
            </span>
          </div>
        </div>

        <div :class="['flex flex-wrap items-center gap-2 lg:justify-end']">
          <button
            type="button"
            :class="[
              'inline-flex items-center rounded-full border border-[#d8e4f5] bg-white px-5 py-2.5 text-sm font-medium text-slate-800',
              'shadow-[0_16px_38px_rgba(132,161,204,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#f8fbff]',
            ]"
            @click="emit('focus')"
          >
            {{ actionFocusLabel }}
          </button>
          <button
            type="button"
            :class="[
              'inline-flex items-center rounded-full border border-[#d8e4f5] bg-[#eef5ff] px-5 py-2.5 text-sm font-medium text-[#5b7292]',
              'transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd2ea] hover:bg-[#e6f0ff] hover:text-slate-800',
            ]"
            @click="emit('settings')"
          >
            {{ actionSettingsLabel }}
          </button>
        </div>
      </div>

      <div
        :class="[
          'relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.9rem] border border-[#d9e5f4]',
          'bg-[linear-gradient(180deg,rgba(250,252,255,0.96),rgba(239,246,255,0.92))]',
          'px-4 pb-4 pt-4 md:px-6 md:pb-5 md:pt-5',
        ]"
      >
        <div
          :class="[
            'pointer-events-none absolute inset-x-0 top-0 h-[11rem]',
            'bg-[radial-gradient(circle_at_top,_rgba(225,239,255,1),_transparent_72%)]',
          ]"
        />

        <div
          :class="[
            'pointer-events-none absolute bottom-[-2rem] left-[12%] h-[8rem] w-[76%] rounded-full',
            'bg-white/90 blur-[48px]',
          ]"
        />

        <div
          :class="[
            'absolute inset-x-4 top-4 z-20 flex flex-col gap-4 lg:inset-x-6 lg:top-5 lg:flex-row lg:items-start lg:justify-between',
          ]"
        >
          <div
            :class="[
              'max-w-[20rem] rounded-[1.5rem] border border-white/90 bg-white/82 px-4 py-4',
              'shadow-[0_18px_44px_rgba(132,161,204,0.14)] backdrop-blur-[20px]',
            ]"
            :style="orbStyle"
          >
            <h1 :class="['text-lg leading-tight font-semibold tracking-[-0.04em] text-slate-900 md:text-[1.45rem]']">
              {{ title }}
            </h1>
            <p :class="['mt-3 text-sm leading-6 text-slate-600']">
              {{ description }}
            </p>
          </div>

          <div :class="['grid gap-2 sm:grid-cols-3 lg:w-[23rem]']">
            <article
              v-for="stat in stats"
              :key="stat.label"
              :class="[
                'rounded-[1.25rem] border border-white/90 bg-white/72 px-3 py-3 backdrop-blur-[18px]',
              ]"
            >
              <p :class="['text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[#7d93b0]']">
                {{ stat.label }}
              </p>
              <p :class="['mt-2 text-sm leading-6 text-slate-700']">
                {{ stat.value }}
              </p>
            </article>
          </div>
        </div>

        <div :class="['frame-outline frame-outline-top-left']" />
        <div :class="['frame-outline frame-outline-top-right']" />
        <div :class="['frame-outline frame-outline-bottom-left']" />
        <div :class="['frame-outline frame-outline-bottom-right']" />

        <div
          :class="[
            'absolute inset-x-0 bottom-0 z-10 h-[8rem]',
            'bg-[linear-gradient(180deg,rgba(245,250,255,0),rgba(245,250,255,0.96))]',
          ]"
        />

        <WidgetStage
          :class="[
            'stage-workspace-widget relative z-0 min-h-[34rem] w-full flex-1 md:min-h-[42rem] xl:min-h-[50rem]',
          ]"
          :paused="isPaused ?? true"
          :focus-at="focusAt"
          :x-offset="stageXOffset"
          :y-offset="stageYOffset"
          :scale="scale"
        />

        <div
          :class="[
            'absolute bottom-5 right-5 z-20 flex justify-end',
          ]"
        >
          <div
            :class="[
              'max-w-[18rem] rounded-full border border-white/90 bg-white/78 px-4 py-3 text-sm leading-6 text-slate-600',
              'shadow-[0_16px_40px_rgba(132,161,204,0.14)] backdrop-blur-[16px]',
            ]"
          >
            {{ note }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.frame-outline {
  position: absolute;
  z-index: 20;
  width: 2.2rem;
  height: 2.2rem;
  border-color: rgba(154, 182, 219, 0.9);
}

.frame-outline-top-left {
  top: 1.2rem;
  left: 1.2rem;
  border-left: 1px solid;
  border-top: 1px solid;
  border-top-left-radius: 1rem;
}

.frame-outline-top-right {
  top: 1.2rem;
  right: 1.2rem;
  border-right: 1px solid;
  border-top: 1px solid;
  border-top-right-radius: 1rem;
}

.frame-outline-bottom-left {
  bottom: 1.2rem;
  left: 1.2rem;
  border-left: 1px solid;
  border-bottom: 1px solid;
  border-bottom-left-radius: 1rem;
}

.frame-outline-bottom-right {
  right: 1.2rem;
  bottom: 1.2rem;
  border-right: 1px solid;
  border-bottom: 1px solid;
  border-bottom-right-radius: 1rem;
}

.stage-workspace-widget {
  animation: workspace-rise 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes workspace-rise {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-workspace-widget {
    animation: none;
  }
}
</style>
