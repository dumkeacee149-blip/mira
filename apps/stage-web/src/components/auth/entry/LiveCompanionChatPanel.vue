<script setup lang="ts">
import type { ChatHistoryItem, StreamingAssistantMessage } from '@proj-mira/stage-ui/types/chat'

import { errorMessageFrom } from '@moeru/std'
import { ChatHistory } from '@proj-mira/stage-ui/components'
import { useChatInputRouting } from '@proj-mira/stage-ui/composables'
import { useChatOrchestratorStore } from '@proj-mira/stage-ui/stores/chat'
import { useChatSessionStore } from '@proj-mira/stage-ui/stores/chat/session-store'
import { useChatStreamStore } from '@proj-mira/stage-ui/stores/chat/stream-store'
import { useConsciousnessStore } from '@proj-mira/stage-ui/stores/modules/consciousness'
import { useProvidersStore } from '@proj-mira/stage-ui/stores/providers'
import { useTextareaAutosize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref } from 'vue'

const props = defineProps<{
  characterGreeting: string
  characterName: string
}>()

const emit = defineEmits<{
  reconfigure: []
}>()

const providersStore = useProvidersStore()
const chatSessionStore = useChatSessionStore()
const chatStreamStore = useChatStreamStore()
const chatOrchestratorStore = useChatOrchestratorStore()
const consciousnessStore = useConsciousnessStore()
const { sendTextInput } = useChatInputRouting()
const { messages } = storeToRefs(chatSessionStore)
const { streamingMessage } = storeToRefs(chatStreamStore)
const { sending } = storeToRefs(chatOrchestratorStore)
const { activeModel, activeProvider } = storeToRefs(consciousnessStore)
const { textarea, input, triggerResize } = useTextareaAutosize()
const isComposing = ref(false)
const sendError = ref('')

const conversationMessages = computed(() => {
  return messages.value.filter(message => message.role !== 'system') as ChatHistoryItem[]
})

const hasConversation = computed(() => conversationMessages.value.length > 0)
const providerLabel = computed(() => {
  if (!activeProvider.value)
    return 'No provider'

  try {
    return providersStore.getProviderMetadata(activeProvider.value).localizedName || activeProvider.value
  }
  catch {
    return activeProvider.value
  }
})

const suggestionPrompts = computed(() => [
  `Introduce yourself as ${props.characterName}.`,
  'Help me choose a gentle first conversation topic.',
  'Summarize how this workspace is configured right now.',
])

async function initializeSession() {
  await chatSessionStore.initialize()
}

async function handleSend() {
  if (!input.value.trim() || isComposing.value || sending.value)
    return

  const outgoingMessage = input.value.trim()
  sendError.value = ''
  input.value = ''
  await nextTick()
  triggerResize()
  textarea.value?.focus()

  try {
    await sendTextInput(outgoingMessage)
  }
  catch (error) {
    input.value = outgoingMessage
    sendError.value = errorMessageFrom(error) ?? 'Failed to send the message.'
  }
}

function fillSuggestion(prompt: string) {
  input.value = prompt
  sendError.value = ''
  void nextTick(() => {
    triggerResize()
    textarea.value?.focus()
  })
}

onMounted(() => {
  void initializeSession()
})
</script>

<template>
  <section
    :class="[
      'relative flex h-full min-h-[36rem] flex-col overflow-hidden rounded-[2rem] border border-[#dbeaf7] bg-white/82 shadow-[0_30px_100px_rgba(132,168,201,0.16)] backdrop-blur-[24px]',
    ]"
  >
    <div :class="['pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(243,250,255,0.98))]']" />

    <div :class="['relative z-10 flex items-start justify-between gap-4 border-b border-[#e0edf7] px-5 py-5 md:px-6']">
      <div>
        <p :class="['text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#84a4c1]']">
          Live Dialogue Console
        </p>
        <h2 :class="['mt-3 text-[2rem] leading-[0.96] font-semibold tracking-[-0.05em] text-slate-950']">
          {{ props.characterName }} is ready on the left. Talk on the right.
        </h2>
        <p :class="['mt-3 max-w-md text-sm leading-7 text-slate-600']">
          {{ props.characterGreeting }}
        </p>
      </div>

      <button
        type="button"
        :class="[
          'rounded-full border border-[#dbeaf7] bg-white/82 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[#6c89a8] transition duration-200 hover:border-[#c8def1] hover:bg-white',
        ]"
        @click="emit('reconfigure')"
      >
        LLM Setup
      </button>
    </div>

    <div :class="['relative z-10 flex flex-wrap items-center gap-2 border-b border-[#e0edf7] px-5 py-4 md:px-6']">
      <span :class="['rounded-full bg-[#f1f8fd] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#7c9dbc]']">
        {{ providerLabel }}
      </span>
      <span :class="['rounded-full bg-[#f1f8fd] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#7c9dbc]']">
        {{ activeModel || 'No model' }}
      </span>
      <span :class="['inline-flex items-center gap-2 rounded-full bg-[#f7fbff] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#7c9dbc]']">
        <span :class="['relative inline-flex h-2 w-2']">
          <span :class="['absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70']" />
          <span :class="['relative inline-flex h-2 w-2 rounded-full bg-emerald-400']" />
        </span>
        Live ready
      </span>
    </div>

    <div :class="['relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 md:px-5 md:pb-5']">
      <div
        v-if="!hasConversation"
        :class="['mb-4 rounded-[1.5rem] border border-[#e0edf7] bg-[#f6fbff] px-4 py-4']"
      >
        <p :class="['text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#84a4c1]']">
          Suggested openers
        </p>
        <div :class="['mt-3 flex flex-wrap gap-2']">
          <button
            v-for="prompt in suggestionPrompts"
            :key="prompt"
            type="button"
            :class="['rounded-full border border-[#dce9f5] bg-white px-3 py-2 text-sm text-slate-600 transition duration-200 hover:border-[#c8def1] hover:text-slate-900']"
            @click="fillSuggestion(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <div
        :class="[
          'min-h-0 flex-1 overflow-hidden rounded-[1.7rem] border border-[#dce7f4] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,249,255,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]',
        ]"
      >
        <ChatHistory
          :messages="conversationMessages"
          :sending="sending"
          :streaming-message="streamingMessage as StreamingAssistantMessage"
          :class="['h-full px-2 pb-2 pt-3 text-slate-700']"
          variant="desktop"
        />
      </div>

      <div
        v-if="sendError"
        :class="['mt-4 rounded-[1.2rem] border border-[#ffd7d5] bg-[#fff6f5] px-4 py-3 text-sm leading-6 text-[#a2453e]']"
      >
        {{ sendError }}
      </div>

      <div :class="['mt-4 rounded-[1.7rem] border border-[#dce7f4] bg-white/88 p-4 shadow-[0_18px_42px_rgba(140,173,205,0.12)]']">
        <textarea
          ref="textarea"
          v-model="input"
          :class="['min-h-[7rem] w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400']"
          :placeholder="`Say something to ${props.characterName}...`"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          @keydown.enter.exact.prevent="void handleSend()"
        />

        <div :class="['mt-4 flex items-center justify-between gap-3']">
          <p :class="['text-xs leading-5 text-slate-400']">
            Press Enter to send. Shift + Enter keeps a newline.
          </p>

          <button
            type="button"
            :disabled="!input.trim() || sending"
            :class="[
              'rounded-full px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white transition duration-200',
              input.trim() && !sending
                ? 'bg-[linear-gradient(135deg,#7dcbff,#8f9cff)] shadow-[0_18px_42px_rgba(134,176,255,0.28)] hover:-translate-y-0.5'
                : 'cursor-not-allowed bg-[#d3e3ef]',
            ]"
            @click="void handleSend()"
          >
            {{ sending ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
