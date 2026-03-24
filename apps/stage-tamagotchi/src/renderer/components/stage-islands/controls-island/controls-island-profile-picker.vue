<script setup lang="ts">
import { useElectronEventaInvoke } from '@proj-mira/electron-vueuse'
import { ProfileSwitcherPopover } from '@proj-mira/stage-ui/components'

import { electronOpenSettings } from '../../../../shared/eventa'

const openSettings = useElectronEventaInvoke(electronOpenSettings)

function handleNavigation() {
  openSettings({ route: '/settings/mira-card' })
}
</script>

<template>
  <ProfileSwitcherPopover placement="up" @create="handleNavigation" @manage="handleNavigation">
    <template #default="{ open, toggle, activeCard }">
      <slot :open="open" :toggle="toggle" :active-card="activeCard" />
    </template>
  </ProfileSwitcherPopover>
</template>
