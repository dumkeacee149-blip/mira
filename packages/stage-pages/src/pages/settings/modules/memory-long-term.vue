<script setup lang="ts">
import { useMemoryStore } from '@proj-mira/stage-ui/stores/modules/memory'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import MemoryLanePanel from './components/memory-lane-panel.vue'

const { t } = useI18n()
const memoryStore = useMemoryStore()
const { episodicEntries, episodicCount, longTermEntries, longTermCount } = storeToRefs(memoryStore)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="border border-neutral-200/80 rounded-xl bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 md:p-6">
      <div class="flex items-start gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
          <div class="i-solar:book-bookmark-bold-duotone text-2xl" />
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="text-lg font-semibold md:text-xl">
            {{ t('settings.pages.modules.memory-long-term.title') }}
          </h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ t('settings.pages.modules.memory-long-term.intro') }}
          </p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-primary-50 px-3 py-1 text-primary-700 font-medium dark:bg-primary-500/10 dark:text-primary-300">
              {{ t('settings.pages.modules.memory-long-term.sections.long-term.count', { count: longTermCount }) }}
            </span>
            <span class="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600 font-medium dark:bg-neutral-800 dark:text-neutral-300">
              {{ t('settings.pages.modules.memory-long-term.sections.episodic.count', { count: episodicCount }) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <MemoryLanePanel
      :title="t('settings.pages.modules.memory-long-term.sections.long-term.title')"
      :description="t('settings.pages.modules.memory-long-term.sections.long-term.description')"
      :entries="longTermEntries"
      :empty-title="t('settings.pages.modules.memory-long-term.sections.long-term.empty-title')"
      :empty-description="t('settings.pages.modules.memory-long-term.sections.long-term.empty-description')"
      :clear-label="t('settings.pages.modules.memory-long-term.actions.clear')"
      :remove-label="t('settings.pages.modules.memory-long-term.actions.remove')"
      @clear="memoryStore.clearLane('memory.long_term')"
      @remove="memoryStore.removeEntry('memory.long_term', $event)"
    />

    <MemoryLanePanel
      :title="t('settings.pages.modules.memory-long-term.sections.episodic.title')"
      :description="t('settings.pages.modules.memory-long-term.sections.episodic.description')"
      :entries="episodicEntries"
      :empty-title="t('settings.pages.modules.memory-long-term.sections.episodic.empty-title')"
      :empty-description="t('settings.pages.modules.memory-long-term.sections.episodic.empty-description')"
      :clear-label="t('settings.pages.modules.memory-long-term.actions.clear')"
      :remove-label="t('settings.pages.modules.memory-long-term.actions.remove')"
      @clear="memoryStore.clearLane('memory.episodic')"
      @remove="memoryStore.removeEntry('memory.episodic', $event)"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.modules.memory-long-term.title
  subtitleKey: settings.title
  stageTransition:
    name: slide
</route>
