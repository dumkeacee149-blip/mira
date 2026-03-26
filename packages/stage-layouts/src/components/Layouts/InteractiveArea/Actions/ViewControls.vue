<script lang="ts" setup>
import { useSettings } from '@proj-mira/stage-ui/stores/settings'
import { Button } from '@proj-mira/ui'
import { storeToRefs } from 'pinia'

const emits = defineEmits<{
  (e: 'reset'): void
}>()

const { stageModelRenderer, stageViewControlsEnabled } = storeToRefs(useSettings())

const mode = defineModel<'x' | 'y' | 'z' | 'scale'>({ required: true })

function handleViewControlsToggle(targetMode: 'x' | 'y' | 'z' | 'scale') {
  if (mode.value === targetMode) {
    emits('reset')
    return
  }

  mode.value = targetMode
}
</script>

<template>
  <div :class="['flex w-full flex-1 items-center justify-end gap-2 self-end']">
    <Transition name="fade">
      <div v-if="stageViewControlsEnabled" :class="['flex w-full justify-between gap-2']">
        <Button variant="secondary-muted" :toggled="mode === 'x'" w-full @click="handleViewControlsToggle('x')">
          X
        </Button>
        <Button variant="secondary-muted" :toggled="mode === 'y'" w-full @click="handleViewControlsToggle('y')">
          Y
        </Button>
        <Button v-if="stageModelRenderer === 'vrm'" variant="secondary-muted" :toggled="mode === 'z'" w-full @click="handleViewControlsToggle('z')">
          Z
        </Button>
        <Button variant="secondary-muted" :toggled="mode === 'scale'" w-full @click="handleViewControlsToggle('scale')">
          Scale
        </Button>
      </div>
    </Transition>
    <button
      :class="[
        'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e5f4]',
        'bg-white/86 text-[#6e88aa] shadow-[0_18px_38px_rgba(119,150,191,0.12)] backdrop-blur-[22px]',
        'transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd3ea] hover:bg-white hover:text-slate-900',
      ]"
      title="View"
      @click="stageViewControlsEnabled = !stageViewControlsEnabled"
    >
      <Transition name="fade" mode="out-in">
        <div v-if="!stageViewControlsEnabled" class="i-solar:tuning-outline text-lg" />
        <div v-else class="i-solar:alt-arrow-right-outline text-lg" />
      </Transition>
    </button>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
