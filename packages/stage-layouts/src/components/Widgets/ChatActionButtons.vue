<script setup lang="ts">
import { useChatMaintenanceStore } from '@proj-mira/stage-ui/stores/chat/maintenance'
import { useTheme } from '@proj-mira/ui'
import { ref } from 'vue'

import { BackgroundDialogPicker } from '../Backgrounds'

const { cleanupMessages } = useChatMaintenanceStore()
const { isDark, toggleDark } = useTheme()

const backgroundDialogOpen = ref(false)
const actionButtonClass = [
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e5f4]',
  'bg-white/86 text-[#6e88aa] shadow-[0_18px_38px_rgba(119,150,191,0.12)] backdrop-blur-[22px]',
  'transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd3ea] hover:bg-white hover:text-slate-900',
]
</script>

<template>
  <BackgroundDialogPicker v-model="backgroundDialogOpen" />
  <div :class="['flex items-center gap-2']">
    <button
      type="button"
      :class="actionButtonClass"
      @click="cleanupMessages()"
    >
      <div class="i-solar:trash-bin-2-bold-duotone text-lg" />
    </button>

    <button
      type="button"
      :class="actionButtonClass"
      @click="() => toggleDark()"
    >
      <Transition name="fade" mode="out-in">
        <div v-if="isDark" class="i-solar:moon-bold text-lg" />
        <div v-else class="i-solar:sun-2-bold text-lg" />
      </Transition>
    </button>

    <button
      type="button"
      title="Background"
      :class="actionButtonClass"
      @click="backgroundDialogOpen = true"
    >
      <div class="i-solar:gallery-wide-bold-duotone text-lg" />
    </button>
  </div>
</template>
