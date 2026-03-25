<script setup lang="ts">
import type { ContextMessage } from '@proj-mira/stage-ui/types/chat'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title: string
  description: string
  entries: ContextMessage[]
  emptyTitle: string
  emptyDescription: string
  clearLabel: string
  removeLabel: string
}>()

const emit = defineEmits<{
  clear: []
  remove: [entryId: string]
}>()

const { locale } = useI18n()

const sortedEntries = computed(() => [...props.entries].sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0)))

function formatTimestamp(value?: number) {
  if (!value)
    return ''

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function resolveSource(entry: ContextMessage) {
  return entry.metadata?.source?.plugin?.id
    ?? entry.metadata?.source?.id
    ?? 'stage'
}
</script>

<template>
  <div class="flex flex-col gap-4 border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex flex-col gap-1">
        <h3 class="text-base font-semibold md:text-lg">
          {{ title }}
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ description }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700 font-medium dark:bg-primary-500/10 dark:text-primary-300">
          {{ sortedEntries.length }}
        </div>
        <button
          v-if="sortedEntries.length"
          type="button"
          class="border border-neutral-200 rounded-full px-3 py-1 text-xs text-neutral-600 font-medium transition dark:border-neutral-700 hover:border-neutral-300 dark:text-neutral-300 hover:text-neutral-900 dark:hover:border-neutral-600 dark:hover:text-white"
          @click="emit('clear')"
        >
          {{ clearLabel }}
        </button>
      </div>
    </div>

    <div v-if="sortedEntries.length" class="grid gap-3">
      <article
        v-for="entry in sortedEntries"
        :key="entry.id"
        class="border border-neutral-200/80 rounded-xl bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-wrap gap-2 text-[11px] text-neutral-400 dark:text-neutral-500">
            <span class="rounded-full bg-white px-2 py-1 dark:bg-neutral-950/70">
              {{ formatTimestamp(entry.createdAt) }}
            </span>
            <span class="rounded-full bg-white px-2 py-1 dark:bg-neutral-950/70">
              {{ entry.lane || 'memory' }}
            </span>
            <span class="rounded-full bg-white px-2 py-1 dark:bg-neutral-950/70">
              {{ resolveSource(entry) }}
            </span>
          </div>
          <button
            type="button"
            class="rounded-full p-1 text-neutral-400 transition hover:bg-white hover:text-neutral-700 dark:hover:bg-neutral-950/70 dark:hover:text-neutral-200"
            :title="removeLabel"
            @click="emit('remove', entry.id)"
          >
            <div class="i-solar:trash-bin-trash-bold-duotone text-lg" />
          </button>
        </div>

        <div class="mt-3 whitespace-pre-wrap break-words text-sm text-neutral-700 dark:text-neutral-100">
          {{ entry.text }}
        </div>

        <div v-if="entry.hints?.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="hint in entry.hints.slice(0, 4)"
            :key="hint"
            class="rounded-full bg-neutral-200/80 px-2 py-1 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {{ hint }}
          </span>
        </div>

        <div v-if="entry.ideas?.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="idea in entry.ideas.slice(0, 4)"
            :key="idea"
            class="rounded-full bg-primary-50 px-2 py-1 text-[11px] text-primary-700 dark:bg-primary-500/10 dark:text-primary-300"
          >
            {{ idea }}
          </span>
        </div>

        <div class="mt-3 truncate text-[11px] text-neutral-400 dark:text-neutral-500">
          {{ entry.contextId }}
        </div>
      </article>
    </div>

    <div
      v-else
      class="border border-neutral-200 rounded-xl border-dashed bg-neutral-50/70 px-4 py-6 text-center dark:border-neutral-800 dark:bg-neutral-900/40"
    >
      <div class="text-sm text-neutral-700 font-medium dark:text-neutral-100">
        {{ emptyTitle }}
      </div>
      <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        {{ emptyDescription }}
      </p>
    </div>
  </div>
</template>
