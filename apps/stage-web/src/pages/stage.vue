<script setup lang="ts">
import type { ChatProvider } from '@xsai-ext/providers/utils'

import type { StageWorkspaceStat } from '../components/stage/types'

import Header from '@proj-mira/stage-layouts/components/Layouts/Header.vue'
import InteractiveArea from '@proj-mira/stage-layouts/components/Layouts/InteractiveArea.vue'
import MobileHeader from '@proj-mira/stage-layouts/components/Layouts/MobileHeader.vue'
import MobileInteractiveArea from '@proj-mira/stage-layouts/components/Layouts/MobileInteractiveArea.vue'
import workletUrl from '@proj-mira/stage-ui/workers/vad/process.worklet?worker&url'

import { BackgroundProvider } from '@proj-mira/stage-layouts/components/Backgrounds'
import { useBackgroundThemeColor } from '@proj-mira/stage-layouts/composables/theme-color'
import { useBackgroundStore } from '@proj-mira/stage-layouts/stores/background'
import { useAudioRecorder } from '@proj-mira/stage-ui/composables/audio/audio-recorder'
import { useVAD } from '@proj-mira/stage-ui/stores/ai/models/vad'
import { useChatOrchestratorStore } from '@proj-mira/stage-ui/stores/chat'
import { useLive2d } from '@proj-mira/stage-ui/stores/live2d'
import { useConsciousnessStore } from '@proj-mira/stage-ui/stores/modules/consciousness'
import { useHearingSpeechInputPipeline } from '@proj-mira/stage-ui/stores/modules/hearing'
import { useProvidersStore } from '@proj-mira/stage-ui/stores/providers'
import { useSettingsAudioDevice } from '@proj-mira/stage-ui/stores/settings'
import { useMediaQuery, useMouse, useWindowSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import StageWorkspaceShell from '../components/stage/StageWorkspaceShell.vue'

import { useFeaturedCharacterProfile } from '../composables/use-featured-character-profile'

const paused = ref(false)
const router = useRouter()
const { t } = useI18n()
const { profile: featuredCharacterProfile } = useFeaturedCharacterProfile()

function handleSettingsOpen(open: boolean) {
  paused.value = open
}

const positionCursor = useMouse()
const viewport = useWindowSize()
const { scale, position } = storeToRefs(useLive2d())
const isCompactStageLayout = useMediaQuery('(max-width: 640px)')

const backgroundStore = useBackgroundStore()
const { selectedOption, sampledColor } = storeToRefs(backgroundStore)
const backgroundSurface = useTemplateRef<InstanceType<typeof BackgroundProvider>>('backgroundSurface')

const { syncBackgroundTheme } = useBackgroundThemeColor({ backgroundSurface, selectedOption, sampledColor })
onMounted(() => syncBackgroundTheme())

const settingsAudioDeviceStore = useSettingsAudioDevice()
const { stream, enabled } = storeToRefs(settingsAudioDeviceStore)
const { startRecord, stopRecord, onStopRecord } = useAudioRecorder(stream)
const hearingPipeline = useHearingSpeechInputPipeline()
const { transcribeForRecording } = hearingPipeline
const { supportsStreamInput } = storeToRefs(hearingPipeline)
const providersStore = useProvidersStore()
const consciousnessStore = useConsciousnessStore()
const { activeProvider: activeChatProvider, activeModel: activeChatModel } = storeToRefs(consciousnessStore)
const chatStore = useChatOrchestratorStore()

const shouldUseStreamInput = computed(() => supportsStreamInput.value && !!stream.value)
const workspaceEyebrow = computed(() => {
  const name = featuredCharacterProfile.value.profile.name
  return name ? `${t('stage.workspace.eyebrow')} / ${name}` : t('stage.workspace.eyebrow')
})
const workspaceBadges = computed(() => {
  const tags = featuredCharacterProfile.value.profile.tags.slice(0, 3)
  if (tags.length)
    return tags

  return [
    t('stage.workspace.badges.scene'),
    t('stage.workspace.badges.voice'),
    t('stage.workspace.badges.memory'),
  ]
})
const workspaceDescription = computed(() => featuredCharacterProfile.value.profile.description || t('stage.workspace.description'))
const workspaceNote = computed(() => featuredCharacterProfile.value.profile.tagline || t('stage.workspace.note'))
const workspaceStats = computed<StageWorkspaceStat[]>(() => [
  {
    label: t('stage.workspace.stats.frame.label'),
    value: t('stage.workspace.stats.frame.value'),
  },
  {
    label: t('stage.workspace.stats.voice.label'),
    value: t('stage.workspace.stats.voice.value'),
  },
  {
    label: t('stage.workspace.stats.archive.label'),
    value: t('stage.workspace.stats.archive.value'),
  },
])
const stageBackdropStyle = computed(() => {
  const width = viewport.width.value || 1
  const height = viewport.height.value || 1
  const offsetX = ((positionCursor.x.value || width / 2) / width - 0.5) * 18
  const offsetY = ((positionCursor.y.value || height / 2) / height - 0.5) * 10

  return {
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
  }
})
const floatingNoteStyle = computed(() => {
  const width = viewport.width.value || 1
  const height = viewport.height.value || 1
  const offsetX = ((positionCursor.x.value || width / 2) / width - 0.5) * -12
  const offsetY = ((positionCursor.y.value || height / 2) / height - 0.5) * -8

  return {
    transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
  }
})

const {
  init: initVAD,
  dispose: disposeVAD,
  start: startVAD,
  loaded: vadLoaded,
} = useVAD(workletUrl, {
  threshold: ref(0.6),
  onSpeechStart: () => handleSpeechStart(),
  onSpeechEnd: () => handleSpeechEnd(),
})

let stopOnStopRecord: (() => void) | undefined

async function startAudioInteraction() {
  try {
    await initVAD()
    if (stream.value)
      await startVAD(stream.value)

    stopOnStopRecord = onStopRecord(async (recording) => {
      const text = await transcribeForRecording(recording)
      if (!text || !text.trim())
        return

      try {
        const provider = await providersStore.getProviderInstance(activeChatProvider.value)
        if (!provider || !activeChatModel.value)
          return

        await chatStore.ingest(text, { model: activeChatModel.value, chatProvider: provider as ChatProvider })
      }
      catch (error) {
        console.error('Failed to send chat from voice:', error)
      }
    })
  }
  catch (error) {
    console.error('Audio interaction init failed:', error)
  }
}

async function handleSpeechStart() {
  if (shouldUseStreamInput.value) {
    return
  }

  startRecord()
}

async function handleSpeechEnd() {
  if (shouldUseStreamInput.value) {
    return
  }

  stopRecord()
}

function stopAudioInteraction() {
  try {
    stopOnStopRecord?.()
    stopOnStopRecord = undefined
    disposeVAD()
  }
  catch {}
}

watch(enabled, async (value) => {
  if (value) {
    await startAudioInteraction()
  }
  else {
    stopAudioInteraction()
  }
}, { immediate: true })

onUnmounted(() => {
  stopAudioInteraction()
})

watch([stream, () => vadLoaded.value], async ([currentStream, loaded]) => {
  if (enabled.value && loaded && currentStream) {
    try {
      await startVAD(currentStream)
    }
    catch (error) {
      console.error('Failed to start VAD with stream:', error)
    }
  }
})

function focusComposer() {
  const composer = document.querySelector('textarea')
  if (composer instanceof HTMLTextAreaElement)
    composer.focus()
}

function openSettings() {
  router.push('/settings')
}

const stageFocus = computed(() => ({
  x: positionCursor.x.value,
  y: positionCursor.y.value,
}))
const stagePresentationScale = computed(() => (isCompactStageLayout.value ? scale.value : scale.value * 0.5))
const stageXOffset = computed(() => `${isCompactStageLayout.value ? position.value.x : position.value.x - 4}%`)
const stageYOffset = computed(() => `${isCompactStageLayout.value ? position.value.y : position.value.y - 48}%`)
</script>

<template>
  <BackgroundProvider
    ref="backgroundSurface"
    :class="[
      'widgets top-widgets',
      'mira-stage-page',
    ]"
    :background="selectedOption"
    :top-color="sampledColor"
  >
    <div
      :class="[
        'relative isolate z-2 h-dvh w-screen overflow-hidden bg-[#eef5ff] text-slate-900',
      ]"
    >
      <div
        :class="[
          'pointer-events-none absolute inset-0 mira-stage-grid',
        ]"
      />
      <div
        :class="[
          'pointer-events-none absolute inset-x-[8%] top-[-7rem] h-[16rem] rounded-[999px]',
          'bg-[linear-gradient(180deg,#d7ebff,#e8f4ff)] opacity-95 blur-[4px] transition-transform duration-500',
        ]"
        :style="stageBackdropStyle"
      />
      <div
        :class="[
          'pointer-events-none absolute left-[-6rem] top-[20%] h-[18rem] w-[18rem] rounded-full',
          'bg-white/90 blur-[54px]',
        ]"
      />
      <div
        :class="[
          'pointer-events-none absolute bottom-[8%] right-[8%] h-[14rem] w-[14rem] rounded-full',
          'bg-[#d7e9ff]/90 blur-[72px]',
        ]"
      />

      <div :class="['relative z-10 flex h-full flex-col']">
        <div :class="['px-3 pt-3 md:px-6 md:pt-5 xl:px-8']">
          <Header v-if="!isCompactStageLayout" />
          <MobileHeader v-else />
        </div>

        <main
          :class="[
            'relative flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 md:px-6 md:pb-6 md:pt-4 xl:px-8',
          ]"
        >
          <div
            :class="[
              'grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,23.5rem)]',
            ]"
          >
            <StageWorkspaceShell
              :action-focus-label="t('stage.workspace.actions.focus')"
              :action-settings-label="t('stage.workspace.actions.settings')"
              :badges="workspaceBadges"
              :description="workspaceDescription"
              :eyebrow="workspaceEyebrow"
              :focus-at="stageFocus"
              :is-paused="paused"
              :note="workspaceNote"
              :orb-style="floatingNoteStyle"
              :scale="stagePresentationScale"
              :stage-x-offset="stageXOffset"
              :stage-y-offset="stageYOffset"
              :stats="workspaceStats"
              :title="t('stage.workspace.title')"
              @focus="focusComposer"
              @settings="openSettings"
            />

            <InteractiveArea
              v-if="!isCompactStageLayout"
              :class="[
                'min-h-0 h-full',
              ]"
            />
          </div>

          <MobileInteractiveArea v-if="isCompactStageLayout" @settings-open="handleSettingsOpen" />
        </main>
      </div>
    </div>
  </BackgroundProvider>
</template>

<route lang="yaml">
name: StageScenePage
meta:
  layout: stage
  stageTransition:
    name: bubble-wave-out
</route>

<style scoped>
.mira-stage-grid {
  background-image:
    linear-gradient(rgba(120, 157, 210, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 157, 210, 0.12) 1px, transparent 1px);
  background-position: center center;
  background-size: 40px 40px;
  mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.2));
}
</style>
