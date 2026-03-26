<script setup lang="ts">
import type { ChatHistoryItem } from '@proj-mira/stage-ui/types/chat'

import { ChatHistory } from '@proj-mira/stage-ui/components'
import { useChatOrchestratorStore } from '@proj-mira/stage-ui/stores/chat'
import { useChatSessionStore } from '@proj-mira/stage-ui/stores/chat/session-store'
import { useChatStreamStore } from '@proj-mira/stage-ui/stores/chat/stream-store'
import { useDeferredMount } from '@proj-mira/ui'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ChatActionButtons from '../Widgets/ChatActionButtons.vue'
import ChatArea from '../Widgets/ChatArea.vue'
import ChatContainer from '../Widgets/ChatContainer.vue'
import ActionAbout from './InteractiveArea/Actions/About.vue'
import ActionViewControls from './InteractiveArea/Actions/ViewControls.vue'

const { isReady } = useDeferredMount()
const { sending } = storeToRefs(useChatOrchestratorStore())
const { messages } = storeToRefs(useChatSessionStore())
const { streamingMessage } = storeToRefs(useChatStreamStore())
const { t } = useI18n()

const isLoading = ref(true)
const viewControlsActiveMode = ref<'x' | 'y' | 'z' | 'scale'>('scale')
const historyMessages = computed(() => messages.value as unknown as ChatHistoryItem[])
const panelStats = computed(() => [
  {
    label: t('stage.landing.panel.stats.input.label'),
    value: t('stage.landing.panel.stats.input.value'),
  },
  {
    label: t('stage.landing.panel.stats.focus.label'),
    value: t('stage.landing.panel.stats.focus.value'),
  },
  {
    label: t('stage.landing.panel.stats.mood.label'),
    value: t('stage.landing.panel.stats.mood.value'),
  },
])
</script>

<template>
  <section
    :class="[
      'relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-[#d8e5f3]',
      'bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,249,255,0.98))] text-slate-900',
      'shadow-[0_28px_90px_rgba(119,150,191,0.14)] backdrop-blur-[24px]',
    ]"
  >
    <div
      :class="[
        'pointer-events-none absolute inset-0',
        'bg-[radial-gradient(circle_at_top,_rgba(226,239,255,0.98),_transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.06))]',
      ]"
    />

    <div
      :class="[
        'relative flex items-start justify-between gap-4 border-b border-[#dbe7f4] px-5 py-5 md:px-6',
      ]"
    >
      <div :class="['space-y-3']">
        <div
          :class="[
            'inline-flex items-center rounded-full border border-white/90 bg-white/86 px-3 py-1.5',
            'text-[0.64rem] font-medium uppercase tracking-[0.26em] text-[#6d86a8]',
          ]"
        >
          {{ t('stage.landing.panel.eyebrow') }}
        </div>

        <div :class="['max-w-sm']">
          <h2 :class="['text-xl font-semibold tracking-[-0.04em] text-slate-900 md:text-2xl']">
            {{ t('stage.landing.panel.title') }}
          </h2>
          <p :class="['mt-2 text-sm leading-6 text-slate-600']">
            {{ t('stage.landing.panel.description') }}
          </p>
        </div>
      </div>

      <ActionAbout />
    </div>

    <div
      :class="[
        'relative grid grid-cols-3 gap-3 border-b border-[#dbe7f4] px-5 py-4 md:px-6',
      ]"
    >
      <article
        v-for="stat in panelStats"
        :key="stat.label"
        :class="[
          'rounded-[1.2rem] border border-white/90 bg-white/72 px-3 py-3 backdrop-blur-[18px]',
        ]"
      >
        <p :class="['text-[0.62rem] font-medium uppercase tracking-[0.26em] text-[#8298b5]']">
          {{ stat.label }}
        </p>
        <p :class="['mt-2 text-sm font-medium text-slate-700']">
          {{ stat.value }}
        </p>
      </article>
    </div>

    <div :class="['relative flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 md:px-5']">
      <div :class="['flex items-center justify-between gap-3 px-1 pb-3']">
        <div :class="['inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[#6b84a6]']">
          <span :class="['relative inline-flex h-2 w-2']">
            <span :class="['absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70']" />
            <span :class="['relative inline-flex h-2 w-2 rounded-full bg-emerald-400']" />
          </span>
          {{ t('stage.landing.panel.status.live') }}
        </div>

        <span
          :class="[
            'rounded-full border border-white/90 bg-white/72 px-3 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.26em] text-[#7890af]',
          ]"
        >
          {{ t('stage.landing.panel.status.synced') }}
        </span>
      </div>

      <div :class="['flex min-h-0 flex-1 flex-col']">
        <ChatContainer>
          <div
            v-if="isLoading"
            :class="[
              'absolute left-0 top-0 h-px w-full overflow-hidden bg-[#dbe7f4]',
            ]"
          >
            <div :class="['scan-line h-full w-1/3 bg-[#89aee4]']" />
          </div>

          <div :class="['relative flex min-h-0 flex-1 flex-col px-3 pb-0 pt-3 md:px-4']">
            <div
              :class="[
                'min-h-0 flex-1 overflow-hidden rounded-[1.4rem] border border-[#dce7f4]',
                'bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,249,255,0.98))]',
              ]"
            >
              <ChatHistory
                v-if="isReady"
                :messages="historyMessages"
                :sending="sending"
                :streaming-message="streamingMessage"
                :class="[
                  'h-full px-2 pb-2 pt-3 text-slate-700',
                ]"
                variant="desktop"
                @vue:mounted="isLoading = false"
              />
            </div>
          </div>

          <div :class="['relative z-10 mt-auto border-t border-[#dbe7f4] bg-white/78']">
            <ChatArea />
          </div>
        </ChatContainer>
      </div>

      <div :class="['mt-4 flex items-center justify-end gap-3']">
        <ActionViewControls v-model="viewControlsActiveMode" />
        <ChatActionButtons />
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes scan {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(400%);
  }
}

.scan-line {
  animation: scan 2s infinite linear;
}
</style>
