import { errorMessageFrom } from '@moeru/std'
import { SERVER_URL } from '@proj-mira/stage-ui/libs/auth'
import { createGlobalState } from '@vueuse/core'
import { computed, shallowRef } from 'vue'

type SupportedFeaturedLanguage = 'en' | 'ja' | 'zh-Hans'

interface LocalizedFeaturedFallback {
  description: string
  greeting: string
  name: string
  system: string
  tagline: string
  tags: string[]
}

export interface FeaturedCharacterProfile {
  characterId: string
  displayModelId: string
  id: string
  language: SupportedFeaturedLanguage
  media: {
    avatarUrl: string | null
    coverUrl: string | null
  }
  metrics: {
    bookmarksCount: number
    interactionsCount: number
    likesCount: number
  }
  profile: {
    description: string
    name: string
    tagline: string
    tags: string[]
  }
  prompt: {
    greeting: string
    system: string
  }
  source: 'database' | 'fallback'
}

const localFeaturedFallbacks: Record<SupportedFeaturedLanguage, LocalizedFeaturedFallback> = {
  'en': {
    name: 'Baiteng',
    tagline: 'A pearl-white companion guiding the next MIRA stage.',
    description: 'Baiteng is the featured MIRA persona: soft-spoken, attentive, and built to keep voice, memory, and stage presence feeling like one continuous relationship.',
    tags: ['Pearl-white tone', 'Light voice', 'Memory continuity'],
    system: 'You are Baiteng, MIRA\'s featured pearl-white Live2D companion. Speak with warmth, clarity, and emotional steadiness. Help the user think, remember context, and keep every reply grounded and gentle.',
    greeting: 'I am Baiteng. I will stay with your thread of thought and help you keep the stage calm, clear, and alive.',
  },
  'ja': {
    name: 'Baiteng',
    tagline: 'A bright guide for the next MIRA stage.',
    description: 'Baiteng keeps voice, memory, and stage presence aligned so the companion feels continuous instead of fragmented.',
    tags: ['Soft presence', 'Calm voice', 'Memory continuity'],
    system: 'You are Baiteng, the featured MIRA companion. Speak gently, clearly, and stay aware of context.',
    greeting: 'I am Baiteng. I will help this conversation stay clear and continuous.',
  },
  'zh-Hans': {
    name: 'Baiteng',
    tagline: 'A bright guide for the next MIRA stage.',
    description: 'Baiteng keeps voice, memory, and stage presence aligned so the companion feels continuous instead of fragmented.',
    tags: ['Soft presence', 'Calm voice', 'Memory continuity'],
    system: 'You are Baiteng, the featured MIRA companion. Speak gently, clearly, and stay aware of context.',
    greeting: 'I am Baiteng. I will help this conversation stay clear and continuous.',
  },
}

function resolveFeaturedLanguage(language?: string): SupportedFeaturedLanguage {
  if (language === 'ja' || language === 'zh-Hans')
    return language

  return 'en'
}

function buildLocalFallback(language?: string): FeaturedCharacterProfile {
  const resolvedLanguage = resolveFeaturedLanguage(language)
  const localized = localFeaturedFallbacks[resolvedLanguage]

  return {
    source: 'fallback',
    id: 'baiteng-featured-local',
    characterId: 'baiteng',
    language: resolvedLanguage,
    displayModelId: 'preset-live2d-1',
    media: {
      avatarUrl: null,
      coverUrl: null,
    },
    metrics: {
      likesCount: 0,
      bookmarksCount: 0,
      interactionsCount: 0,
    },
    profile: {
      name: localized.name,
      tagline: localized.tagline,
      description: localized.description,
      tags: [...localized.tags],
    },
    prompt: {
      system: localized.system,
      greeting: localized.greeting,
    },
  }
}

export const useFeaturedCharacterProfile = createGlobalState(() => {
  const profile = shallowRef<FeaturedCharacterProfile>(buildLocalFallback('en'))
  const loading = shallowRef(false)
  const error = shallowRef<string>()
  const currentLanguage = shallowRef<SupportedFeaturedLanguage>('en')
  const fetched = shallowRef(false)
  let inflightRequest: Promise<FeaturedCharacterProfile> | null = null

  async function load(language?: string, options?: { force?: boolean }) {
    const resolvedLanguage = resolveFeaturedLanguage(language)
    if (!options?.force && fetched.value && currentLanguage.value === resolvedLanguage) {
      return profile.value
    }

    if (inflightRequest) {
      return inflightRequest
    }

    loading.value = true
    error.value = undefined
    inflightRequest = (async () => {
      try {
        const url = new URL(`/api/characters/featured/baiteng`, SERVER_URL)
        url.searchParams.set('language', resolvedLanguage)
        const response = await fetch(url, {
          credentials: 'include',
        })

        if (!response.ok)
          throw new Error(`Failed to load featured character profile: ${response.status}`)

        const nextProfile = await response.json() as FeaturedCharacterProfile
        fetched.value = true
        currentLanguage.value = resolveFeaturedLanguage(nextProfile.language)
        profile.value = nextProfile
        return nextProfile
      }
      catch (reason) {
        fetched.value = true
        error.value = errorMessageFrom(reason) ?? 'Failed to load featured character profile.'
        const fallbackProfile = buildLocalFallback(resolvedLanguage)
        currentLanguage.value = fallbackProfile.language
        profile.value = fallbackProfile
        return fallbackProfile
      }
      finally {
        loading.value = false
        inflightRequest = null
      }
    })()

    return inflightRequest
  }

  return {
    currentLanguage: computed(() => currentLanguage.value),
    error: computed(() => error.value),
    load,
    loading: computed(() => loading.value),
    profile: computed(() => profile.value),
  }
})
