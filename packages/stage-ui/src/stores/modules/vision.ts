import { useLocalStorageManualReset } from '@proj-mira/stage-shared/composables'
import { defineStore } from 'pinia'
import { computed } from 'vue'

interface VisionAttachmentSummary {
  mimeType: string
}

export const useVisionStore = defineStore('vision', () => {
  const chatImageInputEnabled = useLocalStorageManualReset<boolean>('settings/vision/chat-image-input-enabled', true)
  const lastImageSentAt = useLocalStorageManualReset<number | null>('settings/vision/last-image-sent-at', null)
  const lastImageCount = useLocalStorageManualReset<number>('settings/vision/last-image-count', 0)
  const lastImageMimeTypes = useLocalStorageManualReset<string[]>('settings/vision/last-image-mime-types', [])

  const configured = computed(() => chatImageInputEnabled.value)
  const acceptedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  const accept = acceptedMimeTypes.join(',')

  function markChatImageSent(attachments: VisionAttachmentSummary[]) {
    lastImageSentAt.value = Date.now()
    lastImageCount.value = attachments.length
    lastImageMimeTypes.value = [...new Set(attachments.map(attachment => attachment.mimeType))]
  }

  function resetState() {
    chatImageInputEnabled.reset()
    lastImageSentAt.reset()
    lastImageCount.reset()
    lastImageMimeTypes.reset()
  }

  return {
    chatImageInputEnabled,
    lastImageSentAt,
    lastImageCount,
    lastImageMimeTypes,
    configured,
    acceptedMimeTypes,
    accept,
    markChatImageSent,
    resetState,
  }
})
