<script setup lang="ts">
import type { ProviderMetadata } from '../../../../stores/providers'
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button, Callout, FieldInput } from '@proj-mira/ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Alert } from '../../../misc'

interface Props {
  selectedProviderId: string
  selectedProvider: ProviderMetadata | null
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
}

import { useProvidersStore } from '../../../../stores/providers'

const props = defineProps<Props>()
const { t } = useI18n()
const providersStore = useProvidersStore()

const apiKey = ref('')
const baseUrl = ref('')
const accountId = ref('')

const validation = ref<'unchecked' | 'pending' | 'succeed' | 'failed'>('unchecked')
const validationError = ref<any>()

function initializeForm() {
  const provider = props.selectedProvider
  if (!provider) {
    return
  }

  const defaults = provider.defaultOptions?.() || {}
  baseUrl.value = (defaults as any).baseUrl || ''
  apiKey.value = ''
  accountId.value = ''
  validation.value = 'unchecked'
  validationError.value = undefined
}

watch(() => props.selectedProvider?.id, initializeForm)

watch([apiKey, baseUrl, accountId], () => {
  if (validation.value === 'failed' || validation.value === 'succeed') {
    validation.value = 'unchecked'
    validationError.value = undefined
  }
})

const needsApiKey = computed(() => {
  if (!props.selectedProvider)
    return false

  return !['speech-noop', 'browser-local-audio-speech', 'browser-local-audio-transcription', 'app-local-audio-speech', 'app-local-audio-transcription'].includes(props.selectedProvider.id)
})

const needsBaseUrl = computed(() => {
  if (!props.selectedProvider)
    return false

  return !['cloudflare-workers-ai', 'speech-noop'].includes(props.selectedProvider.id)
})

const canProceed = computed(() => {
  if (!props.selectedProviderId)
    return false
  if (needsApiKey.value && !apiKey.value.trim())
    return false
  return validation.value !== 'pending'
})

async function validateConfiguration() {
  if (!props.selectedProvider)
    return

  validation.value = 'pending'
  validationError.value = undefined

  try {
    const config: Record<string, unknown> = {}

    if (needsApiKey.value)
      config.apiKey = apiKey.value.trim()
    if (needsBaseUrl.value)
      config.baseUrl = baseUrl.value.trim()
    if (props.selectedProvider.id === 'cloudflare-workers-ai')
      config.accountId = accountId.value.trim()

    const metadata = providersStore.getProviderMetadata(props.selectedProvider.id)
    const validationResult = await metadata.validators.validateProviderConfig(config)

    validation.value = validationResult.valid ? 'succeed' : 'failed'
    if (validation.value === 'failed')
      validationError.value = validationResult.reason
  }
  catch (error) {
    validation.value = 'failed'
    validationError.value = t('settings.dialogs.onboarding.validationError', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function handleNext() {
  await validateConfiguration()
  if (validation.value === 'succeed') {
    await props.onNext({
      providerId: props.selectedProviderId,
      providerType: 'speech',
      apiKey: apiKey.value,
      baseUrl: baseUrl.value,
      accountId: accountId.value,
    })
  }
}

async function handleContinueAnyway() {
  if (!props.selectedProvider)
    return

  await props.onNext({
    providerId: props.selectedProvider.id,
    providerType: 'speech',
    apiKey: apiKey.value,
    baseUrl: baseUrl.value,
    accountId: accountId.value,
  })
}

function getBaseUrlPlaceholder(_providerId: string): string {
  const defaultOptions = props.selectedProvider?.defaultOptions?.() || {}
  return (defaultOptions as any)?.baseUrl || 'https://api.example.com/v1/'
}

initializeForm()
</script>

<template>
  <div h-full flex flex-col gap-4>
    <div sticky top-0 z-100 flex flex-shrink-0 items-center gap-2>
      <button outline-none @click="props.onPrevious">
        <div i-solar:alt-arrow-left-line-duotone h-5 w-5 />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        {{ t('settings.dialogs.onboarding.configureSpeechProvider', { provider: props.selectedProvider?.localizedName }) }}
      </h2>
      <div h-5 w-5 />
    </div>

    <Callout :label="t('settings.dialogs.onboarding.securityCalloutTitle')" theme="violet">
      <div>
        {{ t('settings.dialogs.onboarding.securityCalloutText') }}
      </div>
    </Callout>

    <div v-if="props.selectedProvider" flex-1 overflow-y-auto space-y-4>
      <div v-if="needsApiKey">
        <FieldInput
          v-model="apiKey"
          :placeholder="t('settings.dialogs.onboarding.apiKeyHelp', { provider: props.selectedProvider?.localizedName })"
          type="password"
          :label="t('settings.dialogs.onboarding.apiKey')"
          :description="t('settings.dialogs.onboarding.apiKey')"
          required
        />
      </div>

      <div v-if="needsBaseUrl">
        <FieldInput
          v-model="baseUrl"
          :placeholder="getBaseUrlPlaceholder(props.selectedProvider.id)"
          type="text"
          :label="t('settings.dialogs.onboarding.baseUrl')"
          :description="t('settings.dialogs.onboarding.baseUrlHelp')"
        />
      </div>
    </div>

    <Alert v-if="validation === 'failed'" type="error">
      <template #title>
        <div class="w-full flex items-center justify-between">
          <span>{{ t('settings.dialogs.onboarding.validationFailed') }}</span>
          <button
            type="button"
            class="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-600 font-medium transition-colors dark:bg-red-800/30 hover:bg-red-200 dark:text-red-300 dark:hover:bg-red-700/40"
            @click="handleContinueAnyway"
          >
            {{ t('settings.pages.providers.common.continueAnyway') }}
          </button>
        </div>
      </template>
      <template v-if="validationError" #content>
        <pre class="whitespace-pre-wrap break-all">{{ String(validationError) }}</pre>
      </template>
    </Alert>

    <Button
      :label="validation === 'failed' ? t('settings.dialogs.onboarding.retry') : t('settings.dialogs.onboarding.saveAndContinue')"
      :loading="validation === 'pending'"
      :disabled="!canProceed"
      @click="handleNext"
    />
  </div>
</template>
