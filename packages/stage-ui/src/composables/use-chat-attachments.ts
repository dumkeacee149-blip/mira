import { nanoid } from 'nanoid'
import { computed, onUnmounted, ref } from 'vue'

export interface ChatImageAttachmentPreview {
  id: string
  name: string
  mimeType: string
  size: number
  data: string
  previewUrl: string
}

export interface ChatImageAttachmentPayload {
  type: 'image'
  mimeType: string
  data: string
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`))

    reader.readAsDataURL(file)
  })
}

function extractBase64Content(dataUrl: string) {
  const [, base64 = ''] = dataUrl.split(',')
  return base64
}

function normalizeAttachmentKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function useChatAttachments() {
  const attachments = ref<ChatImageAttachmentPreview[]>([])
  const loading = ref(false)
  const error = ref('')

  const hasAttachments = computed(() => attachments.value.length > 0)
  const sendPayload = computed<ChatImageAttachmentPayload[]>(() => attachments.value.map(attachment => ({
    type: 'image',
    mimeType: attachment.mimeType,
    data: attachment.data,
  })))

  async function addFiles(files: File[]) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (!imageFiles.length) {
      error.value = 'Only image files can be attached right now.'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const existingKeys = new Set(attachments.value.map(attachment => `${attachment.name}:${attachment.size}:${attachment.mimeType}`))

      for (const file of imageFiles) {
        const normalizedKey = normalizeAttachmentKey(file)
        if (existingKeys.has(normalizedKey))
          continue

        const dataUrl = await readFileAsDataUrl(file)
        attachments.value.push({
          id: nanoid(),
          name: file.name,
          mimeType: file.type || 'image/png',
          size: file.size,
          data: extractBase64Content(dataUrl),
          previewUrl: dataUrl,
        })
        existingKeys.add(normalizedKey)
      }
    }
    catch (attachmentError) {
      error.value = attachmentError instanceof Error ? attachmentError.message : 'Failed to prepare image attachments.'
    }
    finally {
      loading.value = false
    }
  }

  function removeAttachment(attachmentId: string) {
    attachments.value = attachments.value.filter(attachment => attachment.id !== attachmentId)
  }

  function clearAttachments() {
    attachments.value = []
    error.value = ''
  }

  onUnmounted(() => {
    clearAttachments()
  })

  return {
    attachments,
    hasAttachments,
    loading,
    error,
    sendPayload,
    addFiles,
    removeAttachment,
    clearAttachments,
  }
}
