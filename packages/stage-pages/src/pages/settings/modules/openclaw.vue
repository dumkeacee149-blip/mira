<script setup lang="ts">
import { useOpenClawStore } from '@proj-mira/stage-ui/stores/modules/openclaw'
import { Button, FieldCheckbox, FieldInput } from '@proj-mira/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const openClawStore = useOpenClawStore()
const {
  enabled,
  routeChatInput,
  runtimeHealthUrl,
  responseTimeoutMs,
  channelConnected,
  canRouteViaOpenClaw,
  hasPendingRequest,
  runtimeReady,
  runtimeHealth,
  refreshingHealth,
  lastError,
  lastActivityAt,
  lastRemoteMessageAt,
  lastRemoteCompleteAt,
} = storeToRefs(openClawStore)

const routingNotes = computed(() => [
  t('settings.pages.modules.openclaw.notes.item-runtime'),
  t('settings.pages.modules.openclaw.notes.item-attachments'),
  t('settings.pages.modules.openclaw.notes.item-fallback'),
])

let refreshTimer: ReturnType<typeof setInterval> | undefined

const summaryItems = computed(() => [
  {
    label: t('settings.pages.modules.openclaw.status.channel'),
    value: channelConnected.value
      ? t('settings.pages.modules.openclaw.values.connected')
      : t('settings.pages.modules.openclaw.values.disconnected'),
    tone: channelConnected.value ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-300',
  },
  {
    label: t('settings.pages.modules.openclaw.status.routing'),
    value: canRouteViaOpenClaw.value
      ? t('settings.pages.modules.openclaw.values.openclaw')
      : t('settings.pages.modules.openclaw.values.local'),
    tone: canRouteViaOpenClaw.value ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-300',
  },
  {
    label: t('settings.pages.modules.openclaw.status.runtime'),
    value: runtimeReady.value
      ? t('settings.pages.modules.openclaw.values.ready')
      : t('settings.pages.modules.openclaw.values.waiting'),
    tone: runtimeReady.value ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  {
    label: t('settings.pages.modules.openclaw.status.queue'),
    value: hasPendingRequest.value
      ? t('settings.pages.modules.openclaw.values.pending')
      : t('settings.pages.modules.openclaw.values.idle'),
    tone: hasPendingRequest.value ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-300',
  },
])

function formatTimestamp(value?: number) {
  if (!value)
    return t('settings.pages.modules.openclaw.values.not-available')

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

async function refreshHealth() {
  await openClawStore.refreshRuntimeHealth()
}

onMounted(() => {
  void refreshHealth()
  refreshTimer = setInterval(() => {
    void refreshHealth()
  }, 15_000)
})

onUnmounted(() => {
  if (refreshTimer)
    clearInterval(refreshTimer)
})
</script>

<template>
  <div
    :class="[
      'rounded-xl p-4 md:p-6',
      'border border-neutral-200/70 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40',
      'flex flex-col gap-6',
    ]"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500/10 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
          <div class="i-solar:cpu-bolt-bold-duotone text-2xl" />
        </div>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold md:text-xl">
            {{ t('settings.pages.modules.openclaw.title') }}
          </h2>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ t('settings.pages.modules.openclaw.description') }}
          </p>
        </div>
      </div>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        {{ t('settings.pages.modules.openclaw.intro') }}
      </p>
    </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50"
      >
        <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
          {{ item.label }}
        </div>
        <div class="mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium" :class="item.tone">
          {{ item.value }}
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="text-base font-semibold">
              {{ t('settings.pages.modules.openclaw.sections.routing.title') }}
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {{ t('settings.pages.modules.openclaw.sections.routing.description') }}
            </p>
          </div>

          <FieldCheckbox
            v-model="enabled"
            :label="t('settings.pages.modules.openclaw.fields.enabled.label')"
            :description="t('settings.pages.modules.openclaw.fields.enabled.description')"
          />

          <FieldCheckbox
            v-model="routeChatInput"
            :label="t('settings.pages.modules.openclaw.fields.route-chat-input.label')"
            :description="t('settings.pages.modules.openclaw.fields.route-chat-input.description')"
          />

          <FieldInput
            v-model="runtimeHealthUrl"
            :label="t('settings.pages.modules.openclaw.fields.runtime-health-url.label')"
            :description="t('settings.pages.modules.openclaw.fields.runtime-health-url.description')"
            :placeholder="t('settings.pages.modules.openclaw.fields.runtime-health-url.placeholder')"
          />

          <FieldInput
            v-model="responseTimeoutMs"
            type="number"
            :label="t('settings.pages.modules.openclaw.fields.response-timeout-ms.label')"
            :description="t('settings.pages.modules.openclaw.fields.response-timeout-ms.description')"
          />

          <div class="flex flex-wrap gap-2">
            <Button
              :loading="refreshingHealth"
              @click="refreshHealth"
            >
              {{ t('settings.pages.modules.openclaw.actions.refresh-health') }}
            </Button>
          </div>
        </div>
      </div>

      <div class="border border-neutral-200/80 rounded-xl bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="text-base font-semibold">
              {{ t('settings.pages.modules.openclaw.sections.activity.title') }}
            </h3>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {{ t('settings.pages.modules.openclaw.sections.activity.description') }}
            </p>
          </div>

          <div class="grid gap-3">
            <div class="border border-neutral-200/80 rounded-lg bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
                {{ t('settings.pages.modules.openclaw.fields.last-activity.label') }}
              </div>
              <div class="mt-1 text-sm font-medium">
                {{ formatTimestamp(lastActivityAt) }}
              </div>
            </div>

            <div class="border border-neutral-200/80 rounded-lg bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
                {{ t('settings.pages.modules.openclaw.fields.last-health-check.label') }}
              </div>
              <div class="mt-1 text-sm font-medium">
                {{ formatTimestamp(runtimeHealth?.checkedAt) }}
              </div>
            </div>

            <div class="border border-neutral-200/80 rounded-lg bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
                {{ t('settings.pages.modules.openclaw.fields.last-message.label') }}
              </div>
              <div class="mt-1 text-sm font-medium">
                {{ formatTimestamp(lastRemoteMessageAt) }}
              </div>
            </div>

            <div class="border border-neutral-200/80 rounded-lg bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
                {{ t('settings.pages.modules.openclaw.fields.last-complete.label') }}
              </div>
              <div class="mt-1 text-sm font-medium">
                {{ formatTimestamp(lastRemoteCompleteAt) }}
              </div>
            </div>

            <div class="border border-neutral-200/80 rounded-lg bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
              <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
                {{ t('settings.pages.modules.openclaw.fields.runtime-health.label') }}
              </div>
              <div class="mt-1 text-sm font-medium">
                {{ runtimeHealth?.service || t('settings.pages.modules.openclaw.values.not-available') }}
              </div>
              <div class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {{ runtimeHealth?.upstream ? t('settings.pages.modules.openclaw.values.upstream-attached') : t('settings.pages.modules.openclaw.values.upstream-not-attached') }}
              </div>
            </div>
          </div>

          <div
            v-if="lastError || runtimeHealth?.error"
            class="border border-red-200 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
          >
            {{ runtimeHealth?.error || lastError }}
          </div>

          <div class="border border-neutral-200/80 rounded-lg bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
            <div class="text-xs text-neutral-400 tracking-wide uppercase dark:text-neutral-500">
              {{ t('settings.pages.modules.openclaw.notes.title') }}
            </div>
            <div class="mt-3 flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              <div
                v-for="note in routingNotes"
                :key="note"
                class="flex items-start gap-2"
              >
                <div class="i-solar:info-circle-bold-duotone mt-0.5 text-base text-primary-500" />
                <span>{{ note }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              v-if="lastError || runtimeHealth?.error"
              variant="secondary"
              @click="openClawStore.clearError()"
            >
              {{ t('settings.pages.modules.openclaw.actions.clear-error') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: settings
  titleKey: settings.pages.modules.openclaw.title
  subtitleKey: settings.title
  icon: i-solar:cpu-bolt-bold-duotone
  settingsEntry: true
  order: 7
  stageTransition:
    name: slide
</route>
