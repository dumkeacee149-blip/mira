<script setup lang="ts">
import { OnboardingDialog, ToasterRoot } from '@proj-mira/stage-ui/components'
import { useSharedAnalyticsStore } from '@proj-mira/stage-ui/stores/analytics'
import { useCharacterOrchestratorStore } from '@proj-mira/stage-ui/stores/character'
import { useChatSessionStore } from '@proj-mira/stage-ui/stores/chat/session-store'
import { useDisplayModelsStore } from '@proj-mira/stage-ui/stores/display-models'
import { useModsServerChannelStore } from '@proj-mira/stage-ui/stores/mods/api/channel-server'
import { useContextBridgeStore } from '@proj-mira/stage-ui/stores/mods/api/context-bridge'
import { useMiraCardStore } from '@proj-mira/stage-ui/stores/modules/mira-card'
import { useOnboardingStore } from '@proj-mira/stage-ui/stores/onboarding'
import { useSettings } from '@proj-mira/stage-ui/stores/settings'
import { useTheme } from '@proj-mira/ui'
import { StageTransitionGroup } from '@proj-mira/ui-transitions'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRoute } from 'vue-router'
import { toast, Toaster } from 'vue-sonner'

import PerformanceOverlay from './components/Devtools/PerformanceOverlay.vue'

import { syncFeaturedCharacterCard } from './composables/sync-featured-character-card'
import { useFeaturedCharacterProfile } from './composables/use-featured-character-profile'
import { usePWAStore } from './stores/pwa'

usePWAStore()

const contextBridgeStore = useContextBridgeStore()
const i18n = useI18n()
const route = useRoute()
const displayModelsStore = useDisplayModelsStore()
const settingsStore = useSettings()
const settings = storeToRefs(settingsStore)
const onboardingStore = useOnboardingStore()
const chatSessionStore = useChatSessionStore()
const serverChannelStore = useModsServerChannelStore()
const characterOrchestratorStore = useCharacterOrchestratorStore()
const { showingSetup } = storeToRefs(onboardingStore)
const { isDark } = useTheme()
const cardStore = useMiraCardStore()
const analyticsStore = useSharedAnalyticsStore()
const { load: loadFeaturedCharacterProfile, profile: featuredCharacterProfile } = useFeaturedCharacterProfile()

const primaryColor = computed(() => {
  return isDark.value
    ? `color-mix(in srgb, oklch(95% var(--chromatic-chroma-900) calc(var(--chromatic-hue) + ${0})) 70%, oklch(50% 0 360))`
    : `color-mix(in srgb, oklch(95% var(--chromatic-chroma-900) calc(var(--chromatic-hue) + ${0})) 90%, oklch(90% 0 360))`
})

const secondaryColor = computed(() => {
  return isDark.value
    ? `color-mix(in srgb, oklch(95% var(--chromatic-chroma-900) calc(var(--chromatic-hue) + ${180})) 70%, oklch(50% 0 360))`
    : `color-mix(in srgb, oklch(95% var(--chromatic-chroma-900) calc(var(--chromatic-hue) + ${180})) 90%, oklch(90% 0 360))`
})

const tertiaryColor = computed(() => {
  return isDark.value
    ? `color-mix(in srgb, oklch(95% var(--chromatic-chroma-900) calc(var(--chromatic-hue) + ${60})) 70%, oklch(50% 0 360))`
    : `color-mix(in srgb, oklch(95% var(--chromatic-chroma-900) calc(var(--chromatic-hue) + ${60})) 90%, oklch(90% 0 360))`
})

const colors = computed(() => {
  return [primaryColor.value, secondaryColor.value, tertiaryColor.value, isDark.value ? '#121212' : '#FFFFFF']
})

const shouldHideOnboardingDialog = computed(() =>
  route.path === '/'
  || route.path === '/stage'
  || route.path.startsWith('/auth'),
)

const showOnboardingDialog = computed({
  get() {
    return !shouldHideOnboardingDialog.value && showingSetup.value
  },
  set(value: boolean) {
    showingSetup.value = value
  },
})

watch(settings.language, () => {
  i18n.locale.value = settings.language.value
})

watch(() => i18n.locale.value, (language) => {
  void loadFeaturedCharacterProfile(language)
}, { immediate: true })

watch(featuredCharacterProfile, (profile) => {
  syncFeaturedCharacterCard(profile)
}, { immediate: true })

watch(settings.themeColorsHue, () => {
  document.documentElement.style.setProperty('--chromatic-hue', settings.themeColorsHue.value.toString())
}, { immediate: true })

watch(settings.themeColorsHueDynamic, () => {
  document.documentElement.classList.toggle('dynamic-hue', settings.themeColorsHueDynamic.value)
}, { immediate: true })

// Initialize first-time setup check when app mounts
onMounted(async () => {
  analyticsStore.initialize()
  cardStore.initialize()
  syncFeaturedCharacterCard(featuredCharacterProfile.value)

  if (onboardingStore.needsOnboarding) {
    onboardingStore.showingSetup = true
  }

  await chatSessionStore.initialize()
  await serverChannelStore.initialize({ possibleEvents: ['ui:configure'] }).catch(err => console.error('Failed to initialize Mods Server Channel in App.vue:', err))
  await contextBridgeStore.initialize()
  characterOrchestratorStore.initialize()

  await displayModelsStore.loadDisplayModelsFromIndexedDB()
  await settingsStore.initializeStageModel()
})

onUnmounted(() => {
  contextBridgeStore.dispose()
})

// Handle first-time setup events
function handleSetupConfigured() {
  onboardingStore.markSetupCompleted()
}

function handleSetupSkipped() {
  onboardingStore.markSetupSkipped()
}
</script>

<template>
  <StageTransitionGroup
    :primary-color="primaryColor"
    :secondary-color="secondaryColor"
    :tertiary-color="tertiaryColor"
    :colors="colors"
    :z-index="100"
    :disable-transitions="settings.disableTransitions.value"
    :use-page-specific-transitions="settings.usePageSpecificTransitions.value"
  >
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </StageTransitionGroup>

  <ToasterRoot @close="id => toast.dismiss(id)">
    <Toaster />
  </ToasterRoot>

  <!-- First Time Setup Dialog -->
  <OnboardingDialog
    v-model="showOnboardingDialog"
    @configured="handleSetupConfigured"
    @skipped="handleSetupSkipped"
  />

  <PerformanceOverlay />
</template>

<style>
/* We need this to properly animate the CSS variable */
@property --chromatic-hue {
  syntax: '<number>';
  initial-value: 0;
  inherits: true;
}

@keyframes hue-anim {
  from {
    --chromatic-hue: 0;
  }
  to {
    --chromatic-hue: 360;
  }
}

.dynamic-hue {
  animation: hue-anim 10s linear infinite;
}
</style>
