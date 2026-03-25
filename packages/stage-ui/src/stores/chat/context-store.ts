import type { ContextMessage } from '../../types/chat'

import { ContextUpdateStrategy } from '@proj-mira/server-sdk'
import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'

import { getEventSourceKey } from '../../utils/event-source'
import { useMemoryStore } from '../modules/memory'

export const useChatContextStore = defineStore('chat-context', () => {
  const memoryStore = useMemoryStore()
  const activeContexts = ref<Record<string, ContextMessage[]>>({})

  function ingestContextMessage(envelope: ContextMessage) {
    const sourceKey = getEventSourceKey(envelope)
    if (!activeContexts.value[sourceKey]) {
      activeContexts.value[sourceKey] = []
    }

    if (envelope.strategy === ContextUpdateStrategy.ReplaceSelf) {
      activeContexts.value[sourceKey] = [envelope]
    }
    else if (envelope.strategy === ContextUpdateStrategy.AppendSelf) {
      activeContexts.value[sourceKey].push(envelope)
    }
  }

  function resetContexts() {
    activeContexts.value = {}
  }

  function getContextsSnapshot() {
    const activeSnapshot = Object.fromEntries(
      Object.entries(toRaw(activeContexts.value)).map(([key, entries]) => [key, [...entries]]),
    )
    const memorySnapshot = memoryStore.getPromptContextsSnapshot()

    for (const [key, entries] of Object.entries(memorySnapshot)) {
      const mergedEntries = [...entries, ...(activeSnapshot[key] ?? [])]
      const dedupedEntries = mergedEntries.filter((entry, index, source) => {
        const currentKey = entry.contextId || entry.id
        return source.findIndex(candidate => (candidate.contextId || candidate.id) === currentKey) === index
      })

      if (dedupedEntries.length > 0)
        activeSnapshot[key] = dedupedEntries
    }

    return activeSnapshot
  }

  return {
    ingestContextMessage,
    resetContexts,
    getContextsSnapshot,
  }
})
