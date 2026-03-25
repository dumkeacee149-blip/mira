import type { ChatProvider } from '@xsai-ext/providers/utils'

import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useChatOrchestratorStore } from '../stores/chat'
import { useConsciousnessStore } from '../stores/modules/consciousness'
import { useOpenClawStore } from '../stores/modules/openclaw'
import { useVisionStore } from '../stores/modules/vision'
import { useProvidersStore } from '../stores/providers'

interface SendTextInputOptions {
  attachments?: Array<{ type: 'image', data: string, mimeType: string }>
}

export function useChatInputRouting() {
  const providersStore = useProvidersStore()
  const chatOrchestrator = useChatOrchestratorStore()
  const openClawStore = useOpenClawStore()
  const visionStore = useVisionStore()
  const { activeProvider, activeModel } = storeToRefs(useConsciousnessStore())

  const routedByOpenClaw = computed(() => openClawStore.canRouteViaOpenClaw)

  async function sendTextInput(text: string, options?: SendTextInputOptions) {
    if (options?.attachments?.length && !visionStore.chatImageInputEnabled) {
      throw new Error('Image input is currently disabled in Vision settings.')
    }

    if (options?.attachments?.length) {
      const providerConfig = providersStore.getProviderConfig(activeProvider.value)
      await chatOrchestrator.ingest(text, {
        chatProvider: await providersStore.getProviderInstance(activeProvider.value) as ChatProvider,
        model: activeModel.value,
        providerConfig,
        attachments: options.attachments,
      })
      visionStore.markChatImageSent(options.attachments)
      return { mode: 'local' as const, reason: 'attachments' as const }
    }

    if (routedByOpenClaw.value) {
      await openClawStore.routeTextInput(text)
      return { mode: 'openclaw' as const }
    }

    const providerConfig = providersStore.getProviderConfig(activeProvider.value)
    await chatOrchestrator.ingest(text, {
      chatProvider: await providersStore.getProviderInstance(activeProvider.value) as ChatProvider,
      model: activeModel.value,
      providerConfig,
    })

    return { mode: 'local' as const }
  }

  return {
    sendTextInput,
    routedByOpenClaw,
  }
}
