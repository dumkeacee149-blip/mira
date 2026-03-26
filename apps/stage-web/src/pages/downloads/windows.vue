<script setup lang="ts">
import { computed } from 'vue'

import DesktopInstallerDownloadPage from '../../components/downloads/DesktopInstallerDownloadPage.vue'

import { useDesktopDownloads } from '../../composables/use-desktop-downloads'

const { desktopDownloads } = useDesktopDownloads()
const windowsDownload = computed(() => {
  return desktopDownloads.value.find(download => download.id === 'windows') ?? desktopDownloads.value[0]
})
</script>

<template>
  <DesktopInstallerDownloadPage :download="windowsDownload" />
</template>

<route lang="yaml">
name: WindowsDownloadPage
meta:
  layout: plain
</route>
