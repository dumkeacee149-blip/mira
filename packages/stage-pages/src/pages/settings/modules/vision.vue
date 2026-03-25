<script setup lang="ts">
import { useVisionStore } from '@proj-mira/stage-ui/stores/modules/vision'
import { FieldCheckbox } from '@proj-mira/ui'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const visionStore = useVisionStore()
const {
  chatImageInputEnabled,
  lastImageCount,
  lastImageMimeTypes,
  lastImageSentAt,
} = storeToRefs(visionStore)

function formatTimestamp(value: number | null) {
  if (!value)
    return t('settings.pages.modules.vision.status.not-yet')

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="border border-neutral-200/80 rounded-xl bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 md:p-6">
      <div class="flex items-start gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
          <div class="i-solar:eye-bold-duotone text-2xl" />
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="text-lg font-semibold md:text-xl">
            {{ t('settings.pages.modules.vision.title') }}
          </h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ t('settings.pages.modules.vision.intro') }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
          {{ t('settings.pages.modules.vision.fields.chat-image-input.label') }}
        </div>
        <div class="mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium" :class="chatImageInputEnabled ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-300'">
          {{ chatImageInputEnabled ? t('settings.pages.modules.vision.status.enabled') : t('settings.pages.modules.vision.status.disabled') }}
        </div>
      </div>

      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
          {{ t('settings.pages.modules.vision.fields.last-image.label') }}
        </div>
        <div class="mt-3 text-sm text-neutral-800 font-medium dark:text-neutral-100">
          {{ formatTimestamp(lastImageSentAt) }}
        </div>
        <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {{ t('settings.pages.modules.vision.fields.last-image.summary', { count: lastImageCount }) }}
        </div>
      </div>

      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
          {{ t('settings.pages.modules.vision.fields.routing.label') }}
        </div>
        <div class="mt-3 text-sm text-neutral-800 font-medium dark:text-neutral-100">
          {{ t('settings.pages.modules.vision.status.direct-provider') }}
        </div>
        <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {{ t('settings.pages.modules.vision.fields.routing.description') }}
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="text-base font-semibold">
              {{ t('settings.pages.modules.vision.sections.chat-input.title') }}
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {{ t('settings.pages.modules.vision.sections.chat-input.description') }}
            </p>
          </div>

          <FieldCheckbox
            v-model="chatImageInputEnabled"
            :label="t('settings.pages.modules.vision.fields.chat-image-input.label')"
            :description="t('settings.pages.modules.vision.fields.chat-image-input.description')"
          />

          <div class="flex flex-wrap gap-2">
            <span
              v-for="mimeType in visionStore.acceptedMimeTypes"
              :key="mimeType"
              class="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {{ mimeType }}
            </span>
          </div>

          <div v-if="lastImageMimeTypes.length" class="text-xs text-neutral-500 dark:text-neutral-400">
            {{ t('settings.pages.modules.vision.fields.accepted-types.recent', { types: lastImageMimeTypes.join(', ') }) }}
          </div>
        </div>
      </div>

      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="text-base font-semibold">
              {{ t('settings.pages.modules.vision.sections.scope.title') }}
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {{ t('settings.pages.modules.vision.sections.scope.description') }}
            </p>
          </div>

          <div class="flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <div class="flex items-start gap-2">
              <div class="i-solar:check-circle-bold-duotone mt-0.5 text-base text-primary-500" />
              <span>{{ t('settings.pages.modules.vision.notes.item-upload') }}</span>
            </div>
            <div class="flex items-start gap-2">
              <div class="i-solar:check-circle-bold-duotone mt-0.5 text-base text-primary-500" />
              <span>{{ t('settings.pages.modules.vision.notes.item-multimodal') }}</span>
            </div>
            <div class="flex items-start gap-2">
              <div class="i-solar:info-circle-bold-duotone mt-0.5 text-base text-neutral-400" />
              <span>{{ t('settings.pages.modules.vision.notes.item-openclaw') }}</span>
            </div>
            <div class="flex items-start gap-2">
              <div class="i-solar:info-circle-bold-duotone mt-0.5 text-base text-neutral-400" />
              <span>{{ t('settings.pages.modules.vision.notes.item-camera') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.modules.vision.title
  subtitleKey: settings.title
  stageTransition:
    name: slide
    pageSpecificAvailable: true
</route>
