<script setup lang="ts">
import { computed } from 'vue'

import DesktopInstallerDownloadPage from '../../components/downloads/DesktopInstallerDownloadPage.vue'

import { useDesktopDownloads } from '../../composables/use-desktop-downloads'

const { desktopDownloads } = useDesktopDownloads()
const macosDownload = computed(() => {
  return desktopDownloads.value.find(download => download.id === 'macos') ?? desktopDownloads.value[0]
})
</script>

<template>
  <DesktopInstallerDownloadPage :download="macosDownload" />
</template>

<route lang="yaml">
name: MacOSDownloadPage
meta:
  layout: plain
</route>
