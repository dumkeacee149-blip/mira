<script setup lang="ts">
import type { ProviderMetadata } from '../../../../stores/providers'
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-mira/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { RadioCardDetail } from '../../../menu'

interface Props {
  popularProviders: ProviderMetadata[]
  selectedProviderId: string
  onSelectProvider: (provider: ProviderMetadata) => void
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
}

const props = defineProps<Props>()
const { t } = useI18n()

const selectedProviderIdModel = computed({
  get: () => props.selectedProviderId,
  set: (providerId: string) => {
    const provider = props.popularProviders.find(item => item.id === providerId)
    if (provider)
      props.onSelectProvider(provider)
  },
})

function continueForTextOnly() {
  // Keep speech disabled for now.
  void props.onNext({
    providerId: 'speech-noop',
    apiKey: '',
    baseUrl: '',
    accountId: '',
  })
}
</script>

<template>
  <div h-full flex flex-col gap-4>
    <div sticky top-0 z-100 flex flex-shrink-0 items-center gap-2>
      <button outline-none @click="props.onPrevious">
        <div class="i-solar:alt-arrow-left-line-duotone h-5 w-5" />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        {{ t('settings.dialogs.onboarding.selectSpeechProvider') }}
      </h2>
      <div class="h-5 w-5" />
    </div>

    <p class="text-sm text-neutral-600 dark:text-neutral-300">
      {{ t('settings.dialogs.onboarding.speechProviderHint') }}
    </p>

    <div class="flex-1 overflow-y-auto space-y-3">
      <RadioCardDetail
        v-for="provider in props.popularProviders"
        :id="provider.id"
        :key="provider.id"
        v-model="selectedProviderIdModel"
        name="speech-provider-selection"
        :value="provider.id"
        :title="provider.localizedName || provider.id"
        :description="provider.localizedDescription || ''"
      />
    </div>

    <div class="space-y-2">
      <Button
        :label="t('settings.dialogs.onboarding.next')"
        :disabled="!selectedProviderIdModel"
        @click="props.onNext"
      />
      <div>
        <Button
          :label="t('settings.dialogs.onboarding.skipSpeech')"
          variant="secondary"
          @click="continueForTextOnly"
        />
      </div>
    </div>
  </div>
</template>
