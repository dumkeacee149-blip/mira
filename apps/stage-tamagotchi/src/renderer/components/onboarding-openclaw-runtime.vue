<script setup lang="ts">
import type { ElectronRuntimeServiceStatus } from '../../shared/eventa'

import { useElectronEventaInvoke } from '@proj-mira/electron-vueuse'
import { Button, Callout } from '@proj-mira/ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  electronOpenSettings,
  electronRuntimeGetStatus,
  electronRuntimeRestart,
} from '../../shared/eventa'

const props = defineProps<{
  onNext: () => Promise<void> | void
  onPrevious: () => Promise<void> | void
}>()

const { t } = useI18n()

const status = ref<ElectronRuntimeServiceStatus>({ managed: false, processes: [] })
const isBusy = ref(false)
const lastError = ref('')
const lastMessage = ref('')

const getRuntimeStatus = useElectronEventaInvoke(electronRuntimeGetStatus)
const restartRuntime = useElectronEventaInvoke(electronRuntimeRestart)
const openSettings = useElectronEventaInvoke(electronOpenSettings)

let timer: ReturnType<typeof setInterval> | null = null

const isManaged = computed(() => status.value.managed)
const hasProcesses = computed(() => status.value.processes.length > 0)
const isHealthy = computed(
  () => status.value.processes.length > 0
    && status.value.processes.every((item: ElectronRuntimeServiceStatus['processes'][number]) => item.healthy !== false),
)

function formatStatus(process: ElectronRuntimeServiceStatus['processes'][number]) {
  if (process.healthy === undefined)
    return t('settings.pages.modules.runtime-health.status.unknown')
  if (process.healthy)
    return t('settings.pages.modules.runtime-health.status.running')
  return t('settings.pages.modules.runtime-health.status.unhealthy')
}

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
  lastError.value = ''
  lastMessage.value = ''
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

function handleContinue() {
  void props.onNext()
}

async function goToRuntimeSettings() {
  await openSettings({ route: '/settings/runtime-health' })
}

onMounted(() => {
  void refresh()
  timer = setInterval(() => {
    void refresh()
  }, 12_000)
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
})
</script>

<template>
  <div h-full flex flex-col gap-4>
    <div sticky top-0 z-100 flex flex-shrink-0 items-center gap-2>
      <button outline-none @click="props.onPrevious">
        <div i-solar:alt-arrow-left-line-duotone h-5 w-5 />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        {{ t('settings.dialogs.onboarding.openclawRuntimeTitle') }}
      </h2>
      <div h-5 w-5 />
    </div>

    <Callout>
      <template #label>
        {{ t('settings.dialogs.onboarding.openclawRuntimeLabel') }}
      </template>
      <div class="text-sm text-neutral-700 dark:text-neutral-300">
        {{ t('settings.dialogs.onboarding.openclawRuntimeDescription') }}
      </div>
    </Callout>

    <div class="border border-neutral-200 rounded-lg bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <div class="text-sm text-neutral-500">
        {{ t('settings.pages.modules.runtime-health.mode') }}
      </div>
      <div class="mt-1 text-lg font-medium">
        {{ isManaged ? t('settings.pages.modules.runtime-health.managed') : t('settings.pages.modules.runtime-health.not-managed') }}
      </div>
    </div>

    <div class="flex gap-2">
      <Button
        :disabled="isBusy"
        @click="refresh"
      >
        {{ t('settings.pages.modules.runtime-health.actions.refresh') }}
      </Button>
      <Button
        variant="secondary"
        :disabled="isBusy"
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

    <div>
      <div class="mb-2 text-sm font-medium">
        {{ t('settings.pages.modules.runtime-health.title') }}
      </div>
      <div v-if="hasProcesses" class="space-y-2">
        <div
          v-for="proc in status.processes"
          :key="proc.name"
          class="border border-neutral-200 rounded bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900/40"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-medium">{{ proc.name }}</span>
            <span>{{ formatStatus(proc) }}</span>
          </div>
          <div class="mt-1 break-all text-xs opacity-75">
            {{ proc.command }}
          </div>
        </div>
      </div>
      <div v-else class="border border-neutral-300 rounded border-dashed bg-neutral-100 px-3 py-2 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/40">
        {{ t('settings.pages.modules.runtime-health.none') }}
      </div>
    </div>

    <div class="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
      <span v-if="isHealthy" class="text-emerald-600 font-medium">{{ t('settings.dialogs.onboarding.openclawRuntimeReady') }}</span>
      <span v-else class="text-amber-600 font-medium">{{ t('settings.dialogs.onboarding.openclawRuntimeNotReady') }}</span>
    </div>

    <div v-if="!isHealthy" class="border border-amber-200 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
      {{ t('settings.dialogs.onboarding.openclawRuntimeNeedAttention') }}
    </div>

    <div class="flex gap-2">
      <Button
        variant="secondary"
        :disabled="isBusy"
        @click="goToRuntimeSettings"
      >
        {{ t('settings.dialogs.onboarding.openclawRuntimeOpenSettings') }}
      </Button>
      <Button
        variant="primary"
        :disabled="isBusy"
        @click="handleContinue"
      >
        {{ t('settings.dialogs.onboarding.saveAndContinue') }}
      </Button>
    </div>
  </div>
</template>
