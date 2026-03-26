<script setup lang="ts">
import type { ProviderMetadata } from '@proj-mira/stage-ui/stores/providers'

import { useConsciousnessStore } from '@proj-mira/stage-ui/stores/modules/consciousness'
import { useProvidersStore } from '@proj-mira/stage-ui/stores/providers'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'

type SetupStep = 'provider' | 'credentials' | 'model'
type ValidationState = 'idle' | 'pending' | 'error'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  configured: []
}>()

const providersStore = useProvidersStore()
const consciousnessStore = useConsciousnessStore()
const { providers, allChatProvidersMetadata, configuredProviders } = storeToRefs(providersStore)
const {
  activeModel,
  activeProvider,
  isLoadingActiveProviderModels,
  providerModels,
} = storeToRefs(consciousnessStore)

const providerPriority = [
  'openai',
  'anthropic',
  'google-generative-ai',
  'groq',
  'openrouter-ai',
  'deepseek',
  'ollama',
  'openai-compatible',
] as const

const step = ref<SetupStep>('provider')
const selectedProviderId = ref('')
const apiKey = ref('')
const baseUrl = ref('')
const accountId = ref('')
const modelSearch = ref('')
const customModel = ref('')
const validationState = ref<ValidationState>('idle')
const validationMessage = ref('')

const popularProviders = computed(() => {
  const ranked = allChatProvidersMetadata.value
    .filter(provider => providerPriority.includes(provider.id as typeof providerPriority[number]))
    .sort((left, right) => providerPriority.indexOf(left.id as typeof providerPriority[number]) - providerPriority.indexOf(right.id as typeof providerPriority[number]))

  if (ranked.length >= 6)
    return ranked.slice(0, 6)

  const existingIds = new Set(ranked.map(provider => provider.id))
  const extraProviders = allChatProvidersMetadata.value
    .filter(provider => !existingIds.has(provider.id))
    .slice(0, 6 - ranked.length)

  return [...ranked, ...extraProviders]
})

const selectedProvider = computed<ProviderMetadata | null>(() => {
  return allChatProvidersMetadata.value.find(provider => provider.id === selectedProviderId.value) ?? null
})

const stepItems = computed(() => [
  { id: 'provider', label: 'Choose provider' },
  { id: 'credentials', label: 'Connect' },
  { id: 'model', label: 'Pick model' },
])

const needsApiKey = computed(() => {
  if (!selectedProvider.value)
    return false

  return selectedProvider.value.id !== 'ollama' && selectedProvider.value.id !== 'player2'
})

const needsBaseUrl = computed(() => {
  if (!selectedProvider.value)
    return false

  return selectedProvider.value.id !== 'cloudflare-workers-ai'
})

const providerDescription = computed(() => selectedProvider.value?.localizedDescription || selectedProvider.value?.description || '')
const providerDisplayName = computed(() => selectedProvider.value?.localizedName || selectedProvider.value?.name || 'Provider')
const currentProviderConfigured = computed(() => !!selectedProviderId.value && !!configuredProviders.value[selectedProviderId.value])
const providerDefaultBaseUrl = computed(() => {
  const defaults = selectedProvider.value?.defaultOptions?.() || {}
  return typeof defaults.baseUrl === 'string' ? defaults.baseUrl : ''
})

const filteredModels = computed(() => {
  const query = modelSearch.value.trim().toLowerCase()
  const models = providerModels.value

  if (!query)
    return models.slice(0, 10)

  return models
    .filter(model =>
      model.name.toLowerCase().includes(query)
      || model.id.toLowerCase().includes(query)
      || model.description?.toLowerCase().includes(query),
    )
    .slice(0, 10)
})

const customModelValue = computed({
  get: () => customModel.value || activeModel.value,
  set: value => customModel.value = value,
})

const canContinueFromCredentials = computed(() => {
  if (!selectedProviderId.value)
    return false

  if (needsApiKey.value && !apiKey.value.trim())
    return false

  return validationState.value !== 'pending'
})

const canClose = computed(() => !!activeProvider.value && !!activeModel.value)
const canUseCustomModel = computed(() => !!customModelValue.value.trim())

function resetValidation() {
  validationState.value = 'idle'
  validationMessage.value = ''
}

function hydrateProviderForm(providerId: string) {
  if (!providerId)
    return

  const existingConfig = providers.value[providerId] || {}
  const providerMetadata = providersStore.getProviderMetadata(providerId)
  const defaults = providerMetadata.defaultOptions?.() || {}

  apiKey.value = typeof existingConfig.apiKey === 'string' ? existingConfig.apiKey : ''
  baseUrl.value = typeof existingConfig.baseUrl === 'string'
    ? existingConfig.baseUrl
    : typeof defaults.baseUrl === 'string' ? defaults.baseUrl : ''
  accountId.value = typeof existingConfig.accountId === 'string' ? existingConfig.accountId : ''
  customModel.value = activeProvider.value === providerId ? activeModel.value : ''
  modelSearch.value = ''
  resetValidation()
}

function selectProvider(providerId: string) {
  selectedProviderId.value = providerId
  hydrateProviderForm(providerId)
  step.value = 'credentials'
}

function stepBack() {
  resetValidation()

  if (step.value === 'model') {
    step.value = 'credentials'
    return
  }

  if (step.value === 'credentials')
    step.value = 'provider'
}

async function initializeState() {
  const fallbackProviderId = activeProvider.value || popularProviders.value[0]?.id || ''
  if (!fallbackProviderId) {
    step.value = 'provider'
    return
  }

  selectedProviderId.value = fallbackProviderId
  hydrateProviderForm(fallbackProviderId)

  if (activeProvider.value === fallbackProviderId)
    await consciousnessStore.loadModelsForProvider(fallbackProviderId)

  if (props.open && canClose.value) {
    step.value = 'model'
    return
  }

  step.value = activeProvider.value ? 'credentials' : 'provider'
}

function buildProviderConfig() {
  return {
    ...(needsApiKey.value ? { apiKey: apiKey.value.trim() } : {}),
    ...(needsBaseUrl.value ? { baseUrl: (baseUrl.value.trim() || providerDefaultBaseUrl.value).trim() } : {}),
    ...(selectedProviderId.value === 'cloudflare-workers-ai' ? { accountId: accountId.value.trim() } : {}),
  }
}

async function persistProviderConfiguration(options?: { continueAnyway?: boolean }) {
  if (!selectedProviderId.value)
    return

  const config = buildProviderConfig()
  providers.value[selectedProviderId.value] = {
    ...providers.value[selectedProviderId.value],
    ...config,
  }
  providersStore.markProviderAdded(selectedProviderId.value)
  activeProvider.value = selectedProviderId.value
  await nextTick()

  if (options?.continueAnyway) {
    providersStore.forceProviderConfigured(selectedProviderId.value)
  }
  else {
    await providersStore.validateProvider(selectedProviderId.value, { force: true })
  }

  await consciousnessStore.loadModelsForProvider(selectedProviderId.value)
}

async function validateAndContinue(options?: { continueAnyway?: boolean }) {
  if (!selectedProviderId.value || !selectedProvider.value)
    return

  validationState.value = 'pending'
  validationMessage.value = ''

  if (!options?.continueAnyway) {
    try {
      const result = await selectedProvider.value.validators.validateProviderConfig(buildProviderConfig())
      if (!result.valid) {
        validationState.value = 'error'
        validationMessage.value = result.reason || 'Provider validation failed.'
        return
      }
    }
    catch (error) {
      validationState.value = 'error'
      validationMessage.value = error instanceof Error ? error.message : String(error)
      return
    }
  }

  try {
    await persistProviderConfiguration(options)
    validationState.value = 'idle'
    step.value = 'model'
  }
  catch (error) {
    validationState.value = 'error'
    validationMessage.value = error instanceof Error ? error.message : String(error)
  }
}

function finishWithModel(modelId: string) {
  activeModel.value = modelId
  customModel.value = modelId
  emit('configured')
}

function finishWithCustomModel() {
  const normalizedModel = customModelValue.value.trim()
  if (!normalizedModel)
    return

  activeModel.value = normalizedModel
  customModel.value = normalizedModel
  emit('configured')
}

watch(() => props.open, (open) => {
  if (open)
    void initializeState()
}, { immediate: true })

watch(popularProviders, (providersList) => {
  if (!selectedProviderId.value && providersList.length) {
    selectedProviderId.value = providersList[0].id
    hydrateProviderForm(providersList[0].id)
  }
}, { immediate: true })

watch([apiKey, baseUrl, accountId], resetValidation)
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
          LLM Entry Setup
        </p>
        <h2 :class="['mt-3 text-[2rem] leading-[0.96] font-semibold tracking-[-0.05em] text-slate-950']">
          {{
            step === 'provider'
              ? 'Choose the model provider first.'
              : step === 'credentials'
                ? `Connect ${providerDisplayName}.`
                : 'Pick the model that will speak for Baiteng.'
          }}
        </h2>
        <p :class="['mt-3 max-w-md text-sm leading-7 text-slate-600']">
          {{
            step === 'provider'
              ? 'This entry surface writes into the same provider store the main stage already uses, so you only configure it once.'
              : step === 'credentials'
                ? providerDescription || 'Add the credentials or endpoint needed for your chosen provider.'
                : 'You can select a listed model, or type a custom model id if your endpoint exposes one manually.'
          }}
        </p>
      </div>

      <button
        v-if="canClose"
        type="button"
        :class="[
          'rounded-full border border-[#dbeaf7] bg-white/82 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[#6c89a8] transition duration-200 hover:border-[#c8def1] hover:bg-white',
        ]"
        @click="emit('close')"
      >
        Close
      </button>
    </div>

    <div :class="['relative z-10 flex gap-2 border-b border-[#e0edf7] px-5 py-4 md:px-6']">
      <div
        v-for="item in stepItems"
        :key="item.id"
        :class="[
          'inline-flex items-center rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition duration-200',
          step === item.id
            ? 'bg-[linear-gradient(135deg,#e6f4ff,#f6fbff)] text-[#6185a8] shadow-[0_10px_28px_rgba(157,191,224,0.16)]'
            : 'bg-[#f2f8fd] text-[#a0b6cb]',
        ]"
      >
        {{ item.label }}
      </div>
    </div>

    <div :class="['relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-5 pt-5 md:px-6 md:pb-6']">
      <div
        v-if="step === 'provider'"
        :class="['grid gap-3 sm:grid-cols-2']"
      >
        <button
          v-for="provider in popularProviders"
          :key="provider.id"
          type="button"
          :class="[
            'rounded-[1.5rem] border px-4 py-4 text-left transition duration-200',
            selectedProviderId === provider.id
              ? 'border-[#9cd7ff] bg-[linear-gradient(180deg,rgba(241,250,255,0.98),rgba(228,244,255,0.92))] shadow-[0_18px_48px_rgba(151,206,255,0.18)]'
              : 'border-[#dfebf6] bg-white/72 hover:border-[#cde2f2] hover:bg-white',
          ]"
          @click="selectProvider(provider.id)"
        >
          <div :class="['flex items-start justify-between gap-3']">
            <div>
              <p :class="['text-base font-semibold text-slate-900']">
                {{ provider.localizedName || provider.name }}
              </p>
              <p :class="['mt-2 text-sm leading-6 text-slate-600']">
                {{ provider.localizedDescription || provider.description }}
              </p>
            </div>

            <span
              :class="[
                'mt-1 h-3 w-3 rounded-full transition duration-200',
                selectedProviderId === provider.id ? 'bg-[#79c7ff] shadow-[0_0_14px_rgba(121,199,255,0.8)]' : 'bg-[#d7e4f1]',
              ]"
            />
          </div>
        </button>
      </div>

      <div
        v-else-if="step === 'credentials'"
        :class="['flex min-h-0 flex-1 flex-col gap-4']"
      >
        <article
          :class="[
            'rounded-[1.5rem] border border-[#e2eef7] bg-[#f6fbff] px-4 py-4 text-sm leading-7 text-slate-600',
          ]"
        >
          MIRA keeps provider credentials in your local settings store. This step only prepares the same runtime the main stage uses later.
        </article>

        <label
          v-if="needsApiKey"
          :class="['grid gap-2']"
        >
          <span :class="['text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-[#7f9dbc]']">API Key</span>
          <input
            v-model="apiKey"
            type="password"
            :class="['rounded-[1.2rem] border border-[#d9e8f4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-[#9fd8ff] focus:ring-2 focus:ring-[#d8f0ff]']"
            placeholder="sk-..."
          >
        </label>

        <label
          v-if="needsBaseUrl"
          :class="['grid gap-2']"
        >
          <span :class="['text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-[#7f9dbc]']">Base URL</span>
          <input
            v-model="baseUrl"
            type="text"
            :class="['rounded-[1.2rem] border border-[#d9e8f4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-[#9fd8ff] focus:ring-2 focus:ring-[#d8f0ff]']"
            :placeholder="providerDefaultBaseUrl || 'https://api.example.com/v1/'"
          >
        </label>

        <label
          v-if="selectedProviderId === 'cloudflare-workers-ai'"
          :class="['grid gap-2']"
        >
          <span :class="['text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-[#7f9dbc]']">Account ID</span>
          <input
            v-model="accountId"
            type="text"
            :class="['rounded-[1.2rem] border border-[#d9e8f4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-[#9fd8ff] focus:ring-2 focus:ring-[#d8f0ff]']"
            placeholder="Cloudflare account id"
          >
        </label>

        <article
          v-if="validationState === 'error'"
          :class="['rounded-[1.5rem] border border-[#ffd7d5] bg-[#fff6f5] px-4 py-4 text-sm leading-7 text-[#a2453e]']"
        >
          <p :class="['font-semibold']">
            Validation failed
          </p>
          <p :class="['mt-2']">
            {{ validationMessage }}
          </p>
          <button
            type="button"
            :class="['mt-3 inline-flex items-center rounded-full bg-white px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#9f544d] transition duration-200 hover:bg-[#fff1ef]']"
            @click="void validateAndContinue({ continueAnyway: true })"
          >
            Continue anyway
          </button>
        </article>

        <div :class="['mt-auto flex flex-wrap items-center justify-between gap-3 pt-2']">
          <button
            type="button"
            :class="['rounded-full border border-[#dce9f5] bg-white/86 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#6b89a8] transition duration-200 hover:border-[#cae0f1] hover:bg-white']"
            @click="stepBack"
          >
            Back
          </button>

          <button
            type="button"
            :disabled="!canContinueFromCredentials"
            :class="[
              'rounded-full px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white transition duration-200',
              canContinueFromCredentials
                ? 'bg-[linear-gradient(135deg,#7dcbff,#8f9cff)] shadow-[0_18px_42px_rgba(134,176,255,0.28)] hover:-translate-y-0.5'
                : 'cursor-not-allowed bg-[#d3e3ef]',
            ]"
            @click="void validateAndContinue()"
          >
            {{ validationState === 'pending' ? 'Connecting...' : currentProviderConfigured ? 'Refresh models' : 'Continue to models' }}
          </button>
        </div>
      </div>

      <div
        v-else
        :class="['flex min-h-0 flex-1 flex-col gap-4']"
      >
        <div :class="['flex flex-wrap items-center justify-between gap-3']">
          <label :class="['min-w-[14rem] flex-1']">
            <span :class="['sr-only']">Search model</span>
            <input
              v-model="modelSearch"
              type="text"
              :class="['w-full rounded-full border border-[#d9e8f4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-[#9fd8ff] focus:ring-2 focus:ring-[#d8f0ff]']"
              placeholder="Search listed models"
            >
          </label>

          <button
            type="button"
            :class="['rounded-full border border-[#dce9f5] bg-white/86 px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#6b89a8] transition duration-200 hover:border-[#cae0f1] hover:bg-white']"
            @click="stepBack"
          >
            Back
          </button>
        </div>

        <div
          v-if="isLoadingActiveProviderModels"
          :class="['rounded-[1.5rem] border border-[#e2eef7] bg-[#f6fbff] px-4 py-5 text-sm leading-7 text-slate-600']"
        >
          Loading models from {{ providerDisplayName }}...
        </div>

        <div
          v-else-if="filteredModels.length"
          :class="['grid gap-3']"
        >
          <button
            v-for="model in filteredModels"
            :key="model.id"
            type="button"
            :class="[
              'rounded-[1.4rem] border px-4 py-4 text-left transition duration-200',
              activeModel === model.id
                ? 'border-[#9cd7ff] bg-[linear-gradient(180deg,rgba(241,250,255,0.98),rgba(228,244,255,0.92))] shadow-[0_18px_48px_rgba(151,206,255,0.18)]'
                : 'border-[#dfebf6] bg-white/72 hover:border-[#cde2f2] hover:bg-white',
            ]"
            @click="finishWithModel(model.id)"
          >
            <div :class="['flex items-start justify-between gap-3']">
              <div>
                <p :class="['text-sm font-semibold text-slate-900 md:text-base']">
                  {{ model.name }}
                </p>
                <p :class="['mt-1 text-sm leading-6 text-slate-600']">
                  {{ model.description || model.id }}
                </p>
              </div>

              <span :class="['mt-1 rounded-full bg-[#f0f7fd] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#87a4c2]']">
                {{ model.id }}
              </span>
            </div>
          </button>
        </div>

        <div
          v-else
          :class="['rounded-[1.5rem] border border-[#e2eef7] bg-[#f6fbff] px-4 py-5 text-sm leading-7 text-slate-600']"
        >
          No models were listed by this provider. You can still continue with a custom model id below.
        </div>

        <div :class="['mt-auto rounded-[1.6rem] border border-[#dce9f5] bg-white/86 px-4 py-4 shadow-[0_16px_40px_rgba(140,173,205,0.08)]']">
          <p :class="['text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#84a4c1]']">
            Custom model
          </p>
          <input
            v-model="customModelValue"
            type="text"
            :class="['mt-3 w-full rounded-[1.1rem] border border-[#d9e8f4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 focus:border-[#9fd8ff] focus:ring-2 focus:ring-[#d8f0ff]']"
            placeholder="gpt-4.1-mini or your own deployment id"
          >
          <button
            type="button"
            :disabled="!canUseCustomModel"
            :class="[
              'mt-4 rounded-full px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white transition duration-200',
              canUseCustomModel
                ? 'bg-[linear-gradient(135deg,#7dcbff,#8f9cff)] shadow-[0_18px_42px_rgba(134,176,255,0.28)] hover:-translate-y-0.5'
                : 'cursor-not-allowed bg-[#d3e3ef]',
            ]"
            @click="finishWithCustomModel"
          >
            Enter live workspace
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
