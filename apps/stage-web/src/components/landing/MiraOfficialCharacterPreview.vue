<script setup lang="ts">
import { WidgetStage } from '@proj-mira/stage-ui/components/scenes'
import { useElementHover, useIntervalFn, useMouseInElement, usePreferredReducedMotion } from '@vueuse/core'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'

import { miraCharacterPortrait } from '../../assets/mira-character'

const props = defineProps<{
  characterDescription: string
  characterGreeting: string
  characterName: string
  characterTagline: string
}>()

const previewRef = useTemplateRef<HTMLElement>('previewRef')
const stageState = shallowRef<'pending' | 'loading' | 'mounted'>('pending')
const lineIndex = shallowRef(0)
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

const interactionLines = computed(() => [
  props.characterGreeting,
  props.characterTagline,
  props.characterDescription,
  `Move closer and ${props.characterName} follows your attention.`,
].filter(Boolean))

const activeLine = computed(() => {
  const lines = interactionLines.value
  return lines[lineIndex.value] ?? props.characterTagline
})

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

function advanceLine() {
  const lines = interactionLines.value
  if (lines.length <= 1)
    return

  lineIndex.value = (lineIndex.value + 1) % lines.length
}

const { pause: pauseRotation, resume: resumeRotation } = useIntervalFn(advanceLine, 3200, { immediate: false })

watch(interactionLines, (lines) => {
  if (lineIndex.value >= lines.length)
    lineIndex.value = 0
}, { immediate: true })

watch(isHovered, (value) => {
  if (value && !isReducedMotion.value) {
    resumeRotation()
    return
  }

  pauseRotation()
}, { immediate: true })
</script>

<template>
  <div
    ref="previewRef"
    :class="[
      'relative flex h-[25rem] w-full max-w-[30rem] items-end justify-center outline-none md:h-[42rem] md:max-w-[34rem]',
    ]"
    tabindex="0"
    role="button"
    :aria-label="`Preview ${characterName}`"
    @click="advanceLine"
    @keyup.enter="advanceLine"
    @keyup.space.prevent="advanceLine"
  >
    <div
      :class="[
        'pointer-events-none absolute inset-x-[10%] top-[9%] h-[76%] rounded-[2.4rem] opacity-90 transition-transform duration-500 md:inset-x-[2%] md:top-[16%] md:h-[66%]',
        'hero-grid',
        isHovered && 'scale-[1.02]',
      ]"
    />
    <div :class="['pointer-events-none absolute left-[16%] top-[14%] h-10 w-10 rounded-full bg-[#d9adff]/58 blur-[18px] md:left-[10%] md:top-[28%] md:h-12 md:w-12']" />
    <div :class="['pointer-events-none absolute right-[12%] top-[18%] h-14 w-14 rounded-full bg-[#c5f1ff]/62 blur-[22px] md:right-[8%] md:top-[30%] md:h-16 md:w-16']" />
    <div :class="['pointer-events-none absolute bottom-[8%] right-[4%] h-20 w-20 rounded-full bg-white/78 blur-[28px] md:bottom-[12%] md:right-[10%] md:h-24 md:w-24']" />
    <div :class="['pointer-events-none absolute top-[3%] h-[3rem] w-[7rem] opacity-70 md:top-[4%] md:h-[4rem] md:w-[9rem]', 'hero-halo']" />

    <div
      :class="[
        'absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/68 px-4 py-2',
        'text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-700 shadow-[0_16px_40px_rgba(175,166,230,0.16)] backdrop-blur-[16px] md:left-6 md:top-6',
      ]"
    >
      <span
        :class="[
          'h-2 w-2 rounded-full transition duration-300',
          isHovered ? 'bg-[#7c8fff] shadow-[0_0_16px_rgba(124,143,255,0.8)]' : 'bg-[#d5def2]',
        ]"
      />
      {{ characterName }}
    </div>

    <div
      :class="[
        'absolute right-4 top-4 z-20 rounded-full border border-white/50 bg-white/60 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.24em] text-slate-600 backdrop-blur-[14px] md:right-6 md:top-6',
      ]"
    >
      {{ isHovered ? 'Awake' : 'Hover To Wake' }}
    </div>

    <div
      :class="[
        'absolute inset-x-[6%] bottom-[3.5rem] top-[4.2rem] overflow-hidden rounded-[2.2rem] md:inset-x-[8%] md:bottom-[4.5rem] md:top-[5rem]',
      ]"
    >
      <WidgetStage
        v-model:state="stageState"
        :class="[
          'h-full w-full transition-opacity duration-500',
          stageState === 'mounted' ? 'opacity-100' : 'opacity-0',
        ]"
        :paused="isReducedMotion"
        :focus-at="focusAt"
        :scale="0.88"
        x-offset="1%"
        y-offset="-6%"
      />

      <img
        :src="miraCharacterPortrait"
        :alt="characterName"
        :class="[
          'pointer-events-none absolute inset-0 z-10 h-full w-full object-contain px-5 transition-opacity duration-500',
          stageState === 'mounted' ? 'opacity-0' : 'opacity-100',
        ]"
      >
    </div>

    <div
      :class="[
        'absolute bottom-4 left-4 right-4 z-20 rounded-[1.5rem] border border-white/55 bg-white/62 px-4 py-3 text-sm leading-6 text-slate-700',
        'shadow-[0_18px_42px_rgba(175,166,230,0.18)] backdrop-blur-[20px] transition duration-300 md:bottom-6 md:left-6 md:right-6',
        isHovered && 'bg-white/74',
      ]"
    >
      {{ activeLine }}
    </div>
  </div>
</template>

<style scoped>
.hero-grid {
  background-image:
    linear-gradient(rgb(196 222 255 / 0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgb(196 222 255 / 0.55) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgb(0 0 0 / 0.68), rgb(0 0 0 / 0.12));
}

.hero-halo {
  border-radius: 999px;
  background:
    radial-gradient(circle at center, rgb(255 255 255 / 0.92) 0%, rgb(255 255 255 / 0.52) 44%, transparent 72%);
  filter: blur(6px);
}

@media (max-width: 767px) {
  .hero-grid {
    background-size: 28px 28px;
    mask-image: linear-gradient(180deg, rgb(0 0 0 / 0.58), transparent);
  }
}
</style>
