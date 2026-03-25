<script setup lang="ts">
import type { ChatMessage } from '../../../types/chat'

import { computed } from 'vue'

import { MarkdownRenderer } from '../../markdown'

const props = withDefaults(defineProps<{
  message: Extract<ChatMessage, { role: 'user' }>
  label: string
  variant?: 'desktop' | 'mobile'
}>(), {
  variant: 'desktop',
})

function isTextContentPart(part: unknown): part is { type: 'text', text?: string } {
  return !!part && typeof part === 'object' && (part as { type?: string }).type === 'text'
}

function isImageContentPart(part: unknown): part is { type: 'image_url', image_url: { url: string } } {
  return !!part
    && typeof part === 'object'
    && (part as { type?: string }).type === 'image_url'
    && typeof (part as { image_url?: { url?: unknown } }).image_url?.url === 'string'
}

const content = computed(() => {
  const raw = props.message.content
  if (typeof raw === 'string')
    return raw

  if (Array.isArray(raw)) {
    const textPart = raw.find(part => isTextContentPart(part))
    if (textPart?.text)
      return textPart.text

    return raw.map(entry => JSON.stringify(entry)).join('\n')
  }

  return ''
})

const imageParts = computed(() => {
  const raw = props.message.content
  if (!Array.isArray(raw))
    return []

  return raw
    .filter(part => isImageContentPart(part))
    .map(part => ({
      url: String(part.image_url.url),
    }))
})

const containerClasses = computed(() => [
  'flex',
  props.variant === 'mobile' ? 'ml-0 flex-row' : 'ml-12 flex-row-reverse',
])

const boxClasses = computed(() => [
  props.variant === 'mobile' ? 'px-2 py-2 text-sm bg-neutral-100/90 dark:bg-neutral-800/90' : 'px-3 py-3 bg-neutral-100/80 dark:bg-neutral-800/80',
])
</script>

<template>
  <div v-if="message.role === 'user'" :class="containerClasses" class="ph-no-capture">
    <div
      flex="~ col" shadow="sm neutral-200/50 dark:none"
      min-w-20 rounded-xl h="unset <sm:fit"
      :class="boxClasses"
    >
      <div>
        <span text-sm text="black/60 dark:white/65" font-normal class="inline <sm:hidden">{{ label }}</span>
      </div>
      <div v-if="imageParts.length" class="grid mb-3 gap-2">
        <img
          v-for="(imagePart, imageIndex) in imageParts"
          :key="`${imagePart.url}-${imageIndex}`"
          :src="imagePart.url"
          :alt="`${label} attachment ${imageIndex + 1}`"
          class="max-h-52 w-full rounded-lg object-cover"
        >
      </div>
      <MarkdownRenderer
        v-if="content"
        :content="content as string"
        class="break-words"
      />
    </div>
  </div>
</template>
