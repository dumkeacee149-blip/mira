import type { CharacterService } from './characters'

type SupportedFeaturedLanguage = 'en' | 'ja' | 'zh-Hans'

interface FeaturedCharacterLocalizedContent {
  description: string
  greeting: string
  name: string
  systemPrompt: string
  tagline: string
  tags: string[]
}

interface FeaturedCharacterFallbackDefinition {
  characterId: string
  displayModelId: string
  metrics: {
    bookmarksCount: number
    interactionsCount: number
    likesCount: number
  }
  localized: Record<SupportedFeaturedLanguage, FeaturedCharacterLocalizedContent>
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

type CharacterRecord = NonNullable<Awaited<ReturnType<CharacterService['findByCharacterId']>>>

const featuredCharacterFallbacks: Record<string, FeaturedCharacterFallbackDefinition> = {
  baiteng: {
    characterId: 'baiteng',
    displayModelId: 'preset-live2d-1',
    metrics: {
      likesCount: 128,
      bookmarksCount: 64,
      interactionsCount: 1024,
    },
    localized: {
      'en': {
        name: 'Baiteng',
        tagline: 'A pearl-white companion guiding the next MIRA stage.',
        description: 'Baiteng is the featured MIRA persona: soft-spoken, attentive, and built to keep voice, memory, and stage presence feeling like one continuous relationship.',
        tags: ['Pearl-white tone', 'Light voice', 'Memory continuity'],
        systemPrompt: 'You are Baiteng, MIRA\'s featured pearl-white Live2D companion. Speak with warmth, clarity, and emotional steadiness. Help the user think, remember context, and keep every reply grounded and gentle.',
        greeting: 'I am Baiteng. I will stay with your thread of thought and help you keep the stage calm, clear, and alive.',
      },
      'ja': {
        name: '白藤',
        tagline: 'MIRA の次の舞台を導く、白を基調とした伴走者。',
        description: '白藤は MIRA の注目キャラクターです。静かでやわらかな声色で寄り添い、音声、記憶、舞台表現をひとつの関係としてつなぎます。',
        tags: ['白を基調にした存在感', 'やわらかな対話', '記憶の連続性'],
        systemPrompt: 'あなたは白藤、MIRA の白を基調にした Live2D コンパニオンです。やさしく明晰な口調で話し、文脈を保ちながら、ユーザーの思考整理を支えてください。',
        greeting: '白藤です。会話の流れを途切れさせず、静かで透明感のある伴走を届けます。',
      },
      'zh-Hans': {
        name: '白藤',
        tagline: '作为 MIRA 下一阶段的白色主角，持续陪你说话与记忆。',
        description: '白藤是 MIRA 当前主推的陪伴角色。她以更干净的白色调、轻声但稳定的语气，把语音、记忆和舞台临场感收束成同一段连续关系。',
        tags: ['珍珠白气质', '轻声交流', '记忆延续'],
        systemPrompt: '你是白藤，MIRA 当前展示的白色 Live2D 陪伴角色。请用温柔、清醒、稳定的语气与用户交流，帮助用户整理思路、延续上下文，并保持陪伴感。',
        greeting: '我是白藤。我会陪你把这段对话继续下去，让记忆、语气和现场感都保持连贯。',
      },
    },
  },
}

function resolveSupportedLanguage(language?: string): SupportedFeaturedLanguage {
  if (language === 'ja' || language === 'zh-Hans')
    return language

  return 'en'
}

function pickLocalizedContent(
  fallback: FeaturedCharacterFallbackDefinition,
  language?: string,
) {
  const resolvedLanguage = resolveSupportedLanguage(language)
  return {
    language: resolvedLanguage,
    content: fallback.localized[resolvedLanguage],
  }
}

function findLocalizedCharacterProfile(
  character: CharacterRecord,
  language: SupportedFeaturedLanguage,
) {
  return character.i18n.find(item => item.language === language)
    ?? character.i18n.find(item => item.language === 'en')
    ?? character.i18n[0]
}

function findLocalizedPrompt(
  character: CharacterRecord,
  language: SupportedFeaturedLanguage,
  type: 'greetings' | 'system',
) {
  return character.prompts.find(item => item.language === language && item.type === type)
    ?? character.prompts.find(item => item.language === 'en' && item.type === type)
    ?? character.prompts.find(item => item.type === type)
}

function buildFallbackProfile(
  fallback: FeaturedCharacterFallbackDefinition,
  language?: string,
): FeaturedCharacterProfile {
  const { content, language: resolvedLanguage } = pickLocalizedContent(fallback, language)

  return {
    source: 'fallback',
    id: `${fallback.characterId}-featured-fallback`,
    characterId: fallback.characterId,
    language: resolvedLanguage,
    displayModelId: fallback.displayModelId,
    media: {
      avatarUrl: null,
      coverUrl: null,
    },
    metrics: {
      ...fallback.metrics,
    },
    profile: {
      name: content.name,
      tagline: content.tagline,
      description: content.description,
      tags: [...content.tags],
    },
    prompt: {
      system: content.systemPrompt,
      greeting: content.greeting,
    },
  }
}

function buildDatabaseProfile(
  character: CharacterRecord,
  fallback: FeaturedCharacterFallbackDefinition,
  language?: string,
): FeaturedCharacterProfile {
  const { content, language: resolvedLanguage } = pickLocalizedContent(fallback, language)
  const localizedCharacter = findLocalizedCharacterProfile(character, resolvedLanguage)
  const systemPrompt = findLocalizedPrompt(character, resolvedLanguage, 'system')
  const greetingPrompt = findLocalizedPrompt(character, resolvedLanguage, 'greetings')

  return {
    source: 'database',
    id: character.id,
    characterId: character.characterId,
    language: resolvedLanguage,
    displayModelId: fallback.displayModelId,
    media: {
      avatarUrl: character.avatarUrl ?? null,
      coverUrl: character.coverUrl ?? character.cover?.foregroundUrl ?? null,
    },
    metrics: {
      likesCount: character.likesCount,
      bookmarksCount: character.bookmarksCount,
      interactionsCount: character.interactionsCount,
    },
    profile: {
      name: localizedCharacter?.name ?? content.name,
      tagline: localizedCharacter?.tagline ?? content.tagline,
      description: localizedCharacter?.description ?? content.description,
      tags: localizedCharacter?.tags?.length ? localizedCharacter.tags : [...content.tags],
    },
    prompt: {
      system: systemPrompt?.content ?? content.systemPrompt,
      greeting: greetingPrompt?.content ?? content.greeting,
    },
  }
}

export async function getFeaturedCharacterProfile(
  characterService: CharacterService,
  characterId: string,
  language?: string,
) {
  const fallback = featuredCharacterFallbacks[characterId]
  if (!fallback)
    return null

  const character = await characterService.findByCharacterId(characterId)
  if (!character)
    return buildFallbackProfile(fallback, language)

  return buildDatabaseProfile(character, fallback, language)
}
