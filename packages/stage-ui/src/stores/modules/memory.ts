import type { ContextMessage } from '../../types/chat'

import { ContextUpdateStrategy } from '@proj-mira/server-sdk'
import { useLocalStorageManualReset } from '@proj-mira/stage-shared/composables'
import { defineStore } from 'pinia'
import { computed } from 'vue'

type MemoryLaneId = 'memory.short_term' | 'memory.long_term' | 'memory.episodic'

interface MemoryLaneConfig {
  id: MemoryLaneId
  storageKey: string
  storageLimit: number
  promptLimit: number
}

const memoryLaneConfigs: MemoryLaneConfig[] = [
  {
    id: 'memory.short_term',
    storageKey: 'settings/memory/short-term',
    storageLimit: 32,
    promptLimit: 8,
  },
  {
    id: 'memory.long_term',
    storageKey: 'settings/memory/long-term',
    storageLimit: 48,
    promptLimit: 6,
  },
  {
    id: 'memory.episodic',
    storageKey: 'settings/memory/episodic',
    storageLimit: 48,
    promptLimit: 6,
  },
]

function normalizeMemoryLane(lane?: string): MemoryLaneId | null {
  switch (lane) {
    case 'memory.short_term':
    case 'memory.short-term':
      return 'memory.short_term'
    case 'memory.long_term':
    case 'memory.long-term':
      return 'memory.long_term'
    case 'memory.episodic':
      return 'memory.episodic'
    default:
      return null
  }
}

function sortMemoryEntries(entries: ContextMessage[]) {
  return [...entries].sort((left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0))
}

function trimMemoryEntries(entries: ContextMessage[], limit: number) {
  return sortMemoryEntries(entries).slice(0, limit)
}

function dedupeMemoryEntryKey(entry: ContextMessage) {
  return entry.contextId || entry.id
}

export const useMemoryStore = defineStore('memory', () => {
  const shortTermEntries = useLocalStorageManualReset<ContextMessage[]>(memoryLaneConfigs[0].storageKey, [])
  const longTermEntries = useLocalStorageManualReset<ContextMessage[]>(memoryLaneConfigs[1].storageKey, [])
  const episodicEntries = useLocalStorageManualReset<ContextMessage[]>(memoryLaneConfigs[2].storageKey, [])

  const laneState: Record<MemoryLaneId, typeof shortTermEntries> = {
    'memory.short_term': shortTermEntries,
    'memory.long_term': longTermEntries,
    'memory.episodic': episodicEntries,
  }

  const shortTermCount = computed(() => shortTermEntries.value.length)
  const longTermCount = computed(() => longTermEntries.value.length)
  const episodicCount = computed(() => episodicEntries.value.length)
  const totalEntries = computed(() => shortTermCount.value + longTermCount.value + episodicCount.value)
  const configured = computed(() => totalEntries.value > 0)
  const hasShortTermEntries = computed(() => shortTermCount.value > 0)
  const hasLongTermEntries = computed(() => longTermCount.value > 0)
  const hasEpisodicEntries = computed(() => episodicCount.value > 0)

  function getLaneEntries(lane: MemoryLaneId) {
    return laneState[lane].value
  }

  function setLaneEntries(lane: MemoryLaneId, entries: ContextMessage[]) {
    const laneConfig = memoryLaneConfigs.find(config => config.id === lane)
    if (!laneConfig)
      return

    laneState[lane].value = trimMemoryEntries(entries, laneConfig.storageLimit)
  }

  function ingestContextMessage(envelope: ContextMessage) {
    const lane = normalizeMemoryLane(envelope.lane)
    if (!lane)
      return false

    const nextEntries = [...getLaneEntries(lane)]
    const dedupeKey = dedupeMemoryEntryKey(envelope)
    const existingIndex = nextEntries.findIndex(entry => dedupeMemoryEntryKey(entry) === dedupeKey)

    if (existingIndex >= 0) {
      nextEntries.splice(existingIndex, 1, envelope)
    }
    else if (envelope.strategy === ContextUpdateStrategy.ReplaceSelf && envelope.contextId) {
      const replaceIndex = nextEntries.findIndex(entry => entry.contextId === envelope.contextId)
      if (replaceIndex >= 0)
        nextEntries.splice(replaceIndex, 1, envelope)
      else
        nextEntries.unshift(envelope)
    }
    else {
      nextEntries.unshift(envelope)
    }

    setLaneEntries(lane, nextEntries)
    return true
  }

  function removeEntry(lane: MemoryLaneId, entryId: string) {
    setLaneEntries(
      lane,
      getLaneEntries(lane).filter(entry => entry.id !== entryId),
    )
  }

  function clearLane(lane: MemoryLaneId) {
    laneState[lane].value = []
  }

  function getPromptContextsSnapshot() {
    return Object.fromEntries(
      memoryLaneConfigs
        .map((config) => {
          const entries = trimMemoryEntries(getLaneEntries(config.id), config.promptLimit)
          return [config.id, entries] as const
        })
        .filter(([, entries]) => entries.length > 0),
    ) as Record<string, ContextMessage[]>
  }

  function resetState() {
    shortTermEntries.reset()
    longTermEntries.reset()
    episodicEntries.reset()
  }

  return {
    shortTermEntries,
    longTermEntries,
    episodicEntries,
    shortTermCount,
    longTermCount,
    episodicCount,
    totalEntries,
    configured,
    hasShortTermEntries,
    hasLongTermEntries,
    hasEpisodicEntries,

    ingestContextMessage,
    removeEntry,
    clearLane,
    getPromptContextsSnapshot,
    resetState,
  }
})
