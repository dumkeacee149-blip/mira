<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'

import MiraOfficialLandingPage from '../components/landing/MiraOfficialLandingPage.vue'

import { useDesktopDownloads } from '../composables/use-desktop-downloads'
import { useFeaturedCharacterProfile } from '../composables/use-featured-character-profile'

const isMobile = useMediaQuery('(max-width: 767px)')
const { profile: featuredCharacterProfile } = useFeaturedCharacterProfile()
const { desktopDownloads } = useDesktopDownloads()
const characterDescription = computed(() => featuredCharacterProfile.value.profile.description)
const characterGreeting = computed(() => featuredCharacterProfile.value.prompt.greeting)
const characterName = computed(() => featuredCharacterProfile.value.profile.name)
const characterTagline = computed(() => featuredCharacterProfile.value.profile.tagline)
const characterTags = computed(() => featuredCharacterProfile.value.profile.tags.slice(0, 3))
</script>

<template>
  <MiraOfficialLandingPage
    :character-description="characterDescription"
    :character-greeting="characterGreeting"
    :character-name="characterName"
    :character-tagline="characterTagline"
    :character-tags="characterTags"
    :desktop-downloads="desktopDownloads"
    :is-mobile="isMobile"
  />
</template>

<route lang="yaml">
name: OfficialLandingPage
meta:
  layout: plain
</route>
