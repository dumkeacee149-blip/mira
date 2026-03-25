<script setup lang="ts">
import { useMemoryStore } from '@proj-mira/stage-ui/stores/modules/memory'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
const memoryStore = useMemoryStore()
const {
  episodicCount,
  longTermCount,
  shortTermCount,
  totalEntries,
} = storeToRefs(memoryStore)

const summaryCards = computed(() => [
  {
    label: t('settings.pages.memory.sections.overview.total'),
    value: totalEntries.value,
    tone: 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300',
  },
  {
    label: t('settings.pages.modules.memory-short-term.title'),
    value: shortTermCount.value,
    tone: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  },
  {
    label: t('settings.pages.modules.memory-long-term.sections.long-term.title'),
    value: longTermCount.value,
    tone: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  },
  {
    label: t('settings.pages.modules.memory-long-term.sections.episodic.title'),
    value: episodicCount.value,
    tone: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  },
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="border border-neutral-200/80 rounded-xl bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 md:p-6">
      <div class="flex items-start gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
          <div class="i-solar:book-2-bold-duotone text-2xl" />
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="text-lg font-semibold md:text-xl">
            {{ t('settings.pages.memory.title') }}
          </h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ t('settings.pages.memory.intro') }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in summaryCards"
        :key="item.label"
        class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50"
      >
        <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
          {{ item.label }}
        </div>
        <div class="mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium" :class="item.tone">
          {{ item.value }}
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <h3 class="text-base font-semibold">
          {{ t('settings.pages.memory.sections.prompting.title') }}
        </h3>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {{ t('settings.pages.memory.sections.prompting.description') }}
        </p>
      </div>

      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <h3 class="text-base font-semibold">
          {{ t('settings.pages.memory.sections.routes.title') }}
        </h3>
        <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {{ t('settings.pages.memory.sections.routes.description') }}
        </p>

        <div class="grid mt-4 gap-3">
          <RouterLink
            to="/settings/modules/memory-short-term"
            class="flex items-center justify-between border border-neutral-200/80 rounded-xl bg-neutral-50 px-4 py-3 text-sm transition dark:border-neutral-800 hover:border-primary-300 dark:bg-neutral-900/60 hover:bg-primary-50/50 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/10"
          >
            <span>{{ t('settings.pages.memory.sections.routes.open-short') }}</span>
            <div class="i-solar:arrow-right-up-linear text-base" />
          </RouterLink>

          <RouterLink
            to="/settings/modules/memory-long-term"
            class="flex items-center justify-between border border-neutral-200/80 rounded-xl bg-neutral-50 px-4 py-3 text-sm transition dark:border-neutral-800 hover:border-primary-300 dark:bg-neutral-900/60 hover:bg-primary-50/50 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/10"
          >
            <span>{{ t('settings.pages.memory.sections.routes.open-long') }}</span>
            <div class="i-solar:arrow-right-up-linear text-base" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.memory.title
  subtitleKey: settings.title
  descriptionKey: settings.pages.memory.description
  icon: i-solar:leaf-bold-duotone
  settingsEntry: true
  order: 5
  stageTransition:
    name: slide
</route>
