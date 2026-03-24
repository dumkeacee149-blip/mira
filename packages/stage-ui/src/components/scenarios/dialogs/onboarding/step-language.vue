<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-mira/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSettingsGeneral } from '../../../../stores/settings/general'

interface LanguageOption {
  value: string
  label: string
  description: string
}

const props = defineProps<{
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
}>()

const { locale, t } = useI18n()
const generalSettings = useSettingsGeneral()

const options = computed<LanguageOption[]>(() => [
  {
    value: 'zh-Hans',
    label: t('settings.language.zh-cname'),
    description: t('settings.language.zh-description'),
  },
  {
    value: 'en',
    label: t('settings.language.en-cname'),
    description: t('settings.language.en-description'),
  },
])

const selected = computed({
  get: () => (generalSettings.language as unknown as string) || locale.value || 'en',
  set: (value: string) => {
    ;(generalSettings as any).language = value
    locale.value = value
  },
})

function handleNext() {
  void props.onNext()
}
</script>

<template>
  <div h-full flex flex-col gap-4>
    <div sticky top-0 z-100 flex flex-shrink-0 items-center gap-2>
      <button outline-none @click="props.onPrevious">
        <div class="i-solar:alt-arrow-left-line-duotone h-5 w-5" />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        {{ t('settings.dialogs.onboarding.select-language') }}
      </h2>
      <div class="h-5 w-5" />
    </div>
    <p class="text-sm text-neutral-600 dark:text-neutral-300">
      {{ t('settings.dialogs.onboarding.language-description') }}
    </p>
    <div class="flex-1 space-y-3 overflow-y-auto">
      <label
        v-for="option in options"
        :key="option.value"
        class="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
      >
        <input
          v-model="selected"
          type="radio"
          name="onboarding-language"
          :value="option.value"
        />
        <div class="flex-1">
          <div class="font-medium text-neutral-900 dark:text-neutral-100">{{ option.label }}</div>
          <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ option.description }}</div>
        </div>
      </label>
    </div>

    <Button
      :label="t('settings.dialogs.onboarding.saveAndContinue')"
      @click="handleNext"
    />
  </div>
</template>
