<script setup lang="ts">
import type { ElectronRuntimeServiceStatus } from '../../../../shared/eventa'

import { useElectronEventaInvoke } from '@proj-mira/electron-vueuse'
import { Button } from '@proj-mira/ui'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  electronRuntimeGetStatus,
  electronRuntimeRestart,
} from '../../../../shared/eventa'

const { t } = useI18n()

const status = ref<ElectronRuntimeServiceStatus>({ managed: false, processes: [] })
const isBusy = ref(false)
const lastMessage = ref('')
const lastError = ref('')

const getRuntimeStatus = useElectronEventaInvoke(electronRuntimeGetStatus)
const restartRuntime = useElectronEventaInvoke(electronRuntimeRestart)

const hasProcesses = computed(() => status.value.processes.length > 0)

async function refresh() {
  isBusy.value = true
  lastError.value = ''
  try {
    status.value = await getRuntimeStatus()
  }
  catch (error) {
    lastError.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    isBusy.value = false
  }
}

async function handleRestart() {
  isBusy.value = true
  lastMessage.value = ''
  lastError.value = ''
  try {
    await restartRuntime({ force: true })
    await refresh()
    lastMessage.value = t('settings.pages.modules.runtime-health.messages.restarted')
  }
  catch (error) {
    lastError.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    isBusy.value = false
  }
}

function formatStatus(process: ElectronRuntimeServiceStatus['processes'][number]) {
  if (process.healthy === undefined)
    return t('settings.pages.modules.runtime-health.status.unknown')
  if (process.healthy)
    return t('settings.pages.modules.runtime-health.status.running')
  return t('settings.pages.modules.runtime-health.status.unhealthy')
}

function statusClass(process: ElectronRuntimeServiceStatus['processes'][number]) {
  if (process.healthy === undefined)
    return 'bg-neutral-100 text-neutral-600'
  if (process.healthy)
    return 'bg-emerald-50 text-emerald-700'
  return 'bg-red-50 text-red-700'
}

onMounted(() => {
  void refresh()
  setInterval(() => {
    void refresh()
  }, 12000)
})
</script>

<template>
  <div
    :class="[
      'rounded-xl p-4 md:p-6',
      'border border-neutral-200/70 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40',
      'flex flex-col gap-4',
    ]"
  >
    <div class="flex flex-col gap-1">
      <h2 class="text-lg font-semibold md:text-xl">
        {{ t('settings.pages.modules.runtime-health.title') }}
      </h2>
      <p class="text-sm text-neutral-500">
        {{ t('settings.pages.modules.runtime-health.description') }}
      </p>
    </div>

    <div class="border border-neutral-200 rounded-md bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950/50">
      <div class="text-sm text-neutral-500">
        {{ t('settings.pages.modules.runtime-health.mode') }}
      </div>
      <div class="mt-1 font-medium">
        {{ status.managed ? t('settings.pages.modules.runtime-health.managed') : t('settings.pages.modules.runtime-health.not-managed') }}
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button
        :disabled="isBusy"
        @click="refresh"
      >
        {{ t('settings.pages.modules.runtime-health.actions.refresh') }}
      </Button>
      <Button
        :disabled="isBusy"
        variant="secondary"
        @click="handleRestart"
      >
        {{ t('settings.pages.modules.runtime-health.actions.restart') }}
      </Button>
    </div>

    <div v-if="lastMessage" class="border border-emerald-200 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
      {{ lastMessage }}
    </div>

    <div v-if="lastError" class="border border-red-200 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
      {{ lastError }}
    </div>

    <div v-if="hasProcesses" class="space-y-2">
      <div
        v-for="proc in status.processes"
        :key="proc.name"
        :class="['rounded px-3 py-2 text-sm', statusClass(proc), 'dark:bg-white/5']"
      >
        <div class="flex items-center justify-between gap-3 font-medium">
          <span>{{ proc.name }}</span>
          <span>{{ formatStatus(proc) }}</span>
        </div>
        <div class="break-all text-xs opacity-80">
          {{ proc.command }}
        </div>
        <div class="text-xs opacity-75">
          {{ t('settings.pages.modules.runtime-health.fields.pid') }}: {{ proc.pid || '-' }}
        </div>
        <div v-if="proc.lastError" class="text-xs">
          {{ proc.lastError }}
        </div>
      </div>
    </div>

    <div v-else class="border border-neutral-300 rounded-md border-dashed bg-white/70 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/30">
      {{ t('settings.pages.modules.runtime-health.none') }}
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.modules.runtime-health.title
  subtitleKey: settings.title
  icon: i-solar:cpu-bolt-bold-duotone
  settingsEntry: true
  order: 7
  stageTransition:
    name: slide
</route>
