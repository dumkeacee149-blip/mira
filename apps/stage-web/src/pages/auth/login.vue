<script setup lang="ts">
import { useConsciousnessStore } from '@proj-mira/stage-ui/stores/modules/consciousness'
import { useProvidersStore } from '@proj-mira/stage-ui/stores/providers'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import LogoAsset from '../../assets/logo.svg'
import LiveCompanionChatPanel from '../../components/auth/entry/LiveCompanionChatPanel.vue'
import LiveCompanionSetupPanel from '../../components/auth/entry/LiveCompanionSetupPanel.vue'
import LiveCompanionStagePane from '../../components/auth/entry/LiveCompanionStagePane.vue'

import { useFeaturedCharacterProfile } from '../../composables/use-featured-character-profile'

const { profile: featuredCharacterProfile } = useFeaturedCharacterProfile()
const providersStore = useProvidersStore()
const consciousnessStore = useConsciousnessStore()
const { activeModel, activeProvider, configured } = storeToRefs(consciousnessStore)
const showSetupPanel = ref(!configured.value)

const providerLabel = computed(() => {
  if (!activeProvider.value)
    return 'LLM setup'

  try {
    return providersStore.getProviderMetadata(activeProvider.value).localizedName || activeProvider.value
  }
  catch {
    return activeProvider.value
  }
})

const characterName = computed(() => featuredCharacterProfile.value.profile.name)
const characterDescription = computed(() => featuredCharacterProfile.value.profile.description)
const characterTagline = computed(() => featuredCharacterProfile.value.profile.tagline || featuredCharacterProfile.value.profile.description)
const characterGreeting = computed(() => featuredCharacterProfile.value.prompt.greeting || featuredCharacterProfile.value.profile.tagline)

function openSetupPanel() {
  showSetupPanel.value = true
}

function handleConfigured() {
  showSetupPanel.value = false
}

watch(configured, (value) => {
  if (!value)
    showSetupPanel.value = true
})
</script>

<template>
  <div
    :class="[
      'studio-shell relative min-h-screen overflow-hidden bg-[#f7fbff] px-4 pb-4 pt-4 text-slate-950 md:px-6 md:pb-6 md:pt-5 xl:px-8',
    ]"
  >
    <div :class="['pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(227,239,255,0.86),transparent_18%),radial-gradient(circle_at_88%_16%,rgba(210,241,255,0.82),transparent_18%),linear-gradient(180deg,#f7fbff_0%,#f6fbff_100%)]']" />
    <div :class="['pointer-events-none absolute inset-0 studio-cross-grid opacity-75']" />

    <header :class="['relative z-10 mx-auto flex max-w-[1440px] items-center justify-between gap-4']">
      <RouterLink
        to="/"
        :class="['inline-flex items-center gap-3 rounded-full bg-white/82 px-3 py-2 shadow-[0_14px_40px_rgba(138,177,209,0.16)] backdrop-blur-[18px]']"
      >
        <img
          :src="LogoAsset"
          alt="MIRA"
          :class="['h-12 w-auto']"
        >
        <span :class="['hidden text-sm font-semibold tracking-[0.18em] text-slate-900 md:inline-flex']">MIRA</span>
      </RouterLink>

      <div :class="['flex flex-wrap items-center justify-end gap-2']">
        <span :class="['rounded-full bg-white/82 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#6d8aa8] shadow-[0_12px_32px_rgba(138,177,209,0.12)]']">
          {{ providerLabel }}
        </span>
        <span
          v-if="activeModel"
          :class="['rounded-full bg-white/82 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#6d8aa8] shadow-[0_12px_32px_rgba(138,177,209,0.12)]']"
        >
          {{ activeModel }}
        </span>
        <button
          type="button"
          :class="['rounded-full bg-white/82 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#6d8aa8] shadow-[0_12px_32px_rgba(138,177,209,0.12)] transition duration-200 hover:bg-white']"
          @click="openSetupPanel"
        >
          LLM Config
        </button>
      </div>
    </header>

    <main :class="['relative z-10 mx-auto mt-5 grid max-w-[1440px] gap-5 xl:grid-cols-[minmax(0,1fr)_36rem]']">
      <LiveCompanionStagePane
        :character-description="characterDescription"
        :character-greeting="characterGreeting"
        :character-name="characterName"
        :character-tagline="characterTagline"
      />

      <Transition name="panel-fade" mode="out-in">
        <LiveCompanionSetupPanel
          v-if="showSetupPanel"
          :open="showSetupPanel"
          @close="showSetupPanel = false"
          @configured="handleConfigured"
        />

        <LiveCompanionChatPanel
          v-else
          :character-greeting="characterGreeting"
          :character-name="characterName"
          @reconfigure="openSetupPanel"
        />
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.studio-shell::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4.9rem;
  background: linear-gradient(180deg, #def1fb 0%, #dff3fe 100%);
}

.studio-shell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 3.1rem;
  height: 2.75rem;
  background:
    radial-gradient(circle at 2.75rem -1.1rem, transparent 3.05rem, #f7fbff 3.1rem) repeat-x;
  background-size: 7.5rem 100%;
}

.studio-cross-grid {
  background-image:
    linear-gradient(rgb(214 230 244 / 0.65) 2px, transparent 2px),
    linear-gradient(90deg, rgb(214 230 244 / 0.65) 2px, transparent 2px);
  background-position: center center;
  background-size: 50px 50px;
  mask-image: linear-gradient(180deg, rgb(255 255 255 / 0.4), rgb(255 255 255 / 1) 12%, rgb(255 255 255 / 1) 88%, rgb(255 255 255 / 0.35));
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
