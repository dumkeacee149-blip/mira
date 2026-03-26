import type { FeaturedCharacterProfile } from './use-featured-character-profile'

import { useMiraCardStore } from '@proj-mira/stage-ui/stores/modules/mira-card'
import { useSettingsStageModel } from '@proj-mira/stage-ui/stores/settings'

const featuredCharacterSyncTag = 'featured:baiteng'

function shouldSyncDefaultCard(name?: string, tags?: string[]) {
  if (name === 'ReLU')
    return true

  if (name === 'Baiteng')
    return true

  return tags?.includes(featuredCharacterSyncTag) ?? false
}

export function syncFeaturedCharacterCard(profile: FeaturedCharacterProfile) {
  const cardStore = useMiraCardStore()
  const stageModelStore = useSettingsStageModel()
  const defaultCard = cardStore.getCard('default')
  if (!defaultCard || !shouldSyncDefaultCard(defaultCard.name, defaultCard.tags))
    return

  const nextTags = Array.from(new Set([
    ...(defaultCard.tags ?? []).filter(tag => tag !== featuredCharacterSyncTag),
    ...profile.profile.tags,
    featuredCharacterSyncTag,
  ]))

  const nextGreetings = profile.prompt.greeting
    ? [profile.prompt.greeting, ...(defaultCard.greetings ?? []).filter(Boolean).slice(0, 2)]
    : defaultCard.greetings

  cardStore.updateCard('default', {
    ...defaultCard,
    name: profile.profile.name,
    description: profile.profile.description,
    systemPrompt: profile.prompt.system || defaultCard.systemPrompt,
    greetings: nextGreetings,
    tags: nextTags,
    extensions: {
      ...defaultCard.extensions,
      mira: {
        ...defaultCard.extensions?.mira,
        modules: {
          ...defaultCard.extensions?.mira?.modules,
          displayModelId: profile.displayModelId || defaultCard.extensions?.mira?.modules?.displayModelId,
        },
        agents: defaultCard.extensions?.mira?.agents ?? {},
      },
    },
  })

  if (cardStore.activeCardId === 'default' && profile.displayModelId) {
    stageModelStore.stageModelSelected = profile.displayModelId
  }
}
