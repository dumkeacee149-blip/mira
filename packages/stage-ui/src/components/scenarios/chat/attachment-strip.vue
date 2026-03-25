<script setup lang="ts">
import type { ChatImageAttachmentPreview } from '../../../composables/use-chat-attachments'

import { computed } from 'vue'

const props = withDefaults(defineProps<{
  attachments: ChatImageAttachmentPreview[]
  variant?: 'desktop' | 'mobile'
}>(), {
  variant: 'desktop',
})

const emit = defineEmits<{
  remove: [attachmentId: string]
}>()

const containerClasses = computed(() => props.variant === 'mobile'
  ? ['gap-2', 'px-3', 'pb-2']
  : ['gap-3', 'px-2', 'pb-3'])

function formatFileSize(size: number) {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div
    v-if="attachments.length"
    :class="containerClasses"
    class="flex flex-wrap"
  >
    <div
      v-for="attachment in attachments"
      :key="attachment.id"
      class="relative w-28 overflow-hidden border border-neutral-200/80 rounded-xl bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/80"
    >
      <img
        :src="attachment.previewUrl"
        :alt="attachment.name"
        class="h-24 w-full object-cover"
      >
      <div class="flex flex-col gap-1 px-2 py-2">
        <div class="truncate text-xs text-neutral-700 font-medium dark:text-neutral-200">
          {{ attachment.name }}
        </div>
        <div class="text-[11px] text-neutral-400 dark:text-neutral-500">
          {{ formatFileSize(attachment.size) }}
        </div>
      </div>
      <button
        type="button"
        class="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
        @click="emit('remove', attachment.id)"
      >
        <div class="i-solar:close-circle-bold text-sm" />
      </button>
    </div>
  </div>
</template>
