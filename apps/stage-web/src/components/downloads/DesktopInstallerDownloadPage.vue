<script setup lang="ts">
import type { DesktopDownloadTarget } from '../../composables/use-desktop-downloads'

import { computed, onMounted, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'

type DownloadPageStatus = 'checking' | 'missing' | 'redirecting'

const props = defineProps<{
  download: DesktopDownloadTarget
}>()

const status = shallowRef<DownloadPageStatus>('checking')

const statusTitle = computed(() => {
  if (status.value === 'redirecting')
    return `Starting ${props.download.label} download`

  if (status.value === 'missing')
    return `${props.download.label} installer is not online yet`

  return `Preparing ${props.download.label} installer`
})

const statusDescription = computed(() => {
  if (status.value === 'redirecting')
    return 'Your installer is opening in the current tab. If the download does not begin automatically, use the direct link below.'

  if (status.value === 'missing')
    return 'This download route is ready, but the public installer URL has not been attached yet. Add the platform package URL in the stage-web environment to make this page start the download immediately.'

  return 'Checking whether the desktop package is ready for download.'
})

onMounted(() => {
  if (!props.download.directHref) {
    status.value = 'missing'
    return
  }

  status.value = 'redirecting'
  window.location.assign(props.download.directHref)
})
</script>

<template>
  <div
    :class="[
      'relative min-h-screen overflow-hidden px-4 py-6 text-slate-950 md:px-8 md:py-10',
      'bg-[radial-gradient(circle_at_18%_16%,rgba(220,177,255,0.34),transparent_18%),radial-gradient(circle_at_84%_12%,rgba(194,238,255,0.56),transparent_18%),linear-gradient(180deg,#f9f5ff_0%,#f5f3ff_34%,#f9fbff_68%,#fffdfd_100%)]',
    ]"
  >
    <div :class="['pointer-events-none absolute inset-0 official-noise opacity-75']" />
    <div :class="['pointer-events-none absolute left-[-10rem] top-[-7rem] h-[22rem] w-[22rem] rounded-full bg-[#dbaeff]/34 blur-[110px]']" />
    <div :class="['pointer-events-none absolute right-[-9rem] top-[1rem] h-[20rem] w-[20rem] rounded-full bg-[#bfeeff]/60 blur-[110px]']" />

    <main :class="['relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-[920px] items-center justify-center']">
      <section
        :class="[
          'w-full overflow-hidden rounded-[2.6rem] border border-white/64 bg-white/70 px-6 py-7 shadow-[0_28px_72px_rgba(165,152,225,0.18)] backdrop-blur-[24px]',
          'md:px-8 md:py-8',
        ]"
      >
        <div :class="['flex items-start justify-between gap-4']">
          <div>
            <p :class="['text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-600']">
              Desktop installer
            </p>
            <h1 :class="['mt-4 text-[2.45rem] leading-[0.92] tracking-[-0.06em] text-slate-950 md:text-[3.4rem]']">
              {{ statusTitle }}
            </h1>
          </div>

          <div
            :class="[
              'grid h-14 w-14 shrink-0 place-items-center rounded-[1.4rem] border border-white/68 bg-white/82 text-slate-900 shadow-[0_16px_34px_rgba(165,152,225,0.16)]',
            ]"
          >
            <span :class="[download.icon, 'h-6 w-6']" />
          </div>
        </div>

        <p :class="['mt-6 max-w-[42rem] text-base leading-8 text-slate-700/84 md:text-[1.05rem]']">
          {{ statusDescription }}
        </p>

        <div :class="['mt-8 grid gap-3 rounded-[2rem] border border-white/62 bg-white/56 p-4 backdrop-blur-[18px] md:grid-cols-[minmax(0,1fr)_auto] md:items-center']">
          <div>
            <p :class="['text-[0.66rem] uppercase tracking-[0.26em] text-slate-500']">
              Package
            </p>
            <p :class="['mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950']">
              {{ download.label }} {{ download.fileLabel }}
            </p>
            <p :class="['mt-2 text-sm leading-6 text-slate-700/76']">
              {{ download.description }}
            </p>
          </div>

          <a
            v-if="download.directHref"
            :href="download.directHref"
            :class="[
              'inline-flex items-center justify-center rounded-full bg-[linear-gradient(90deg,#ca79ff_0%,#78c7ff_100%)] px-6 py-3.5 text-sm tracking-[0.18em] text-white shadow-[0_18px_42px_rgba(154,123,255,0.26)] transition duration-300 hover:-translate-y-0.5',
            ]"
          >
            Download Again
          </a>

          <span
            v-else
            :class="[
              'inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 bg-white/72 px-6 py-3.5 text-sm tracking-[0.18em] text-slate-500',
            ]"
          >
            Installer Pending
          </span>
        </div>

        <div :class="['mt-8 flex flex-col gap-3 sm:flex-row']">
          <RouterLink
            to="/"
            :class="[
              'inline-flex items-center justify-center rounded-full border border-white/66 bg-white/72 px-6 py-3.5 text-sm font-medium text-slate-900 shadow-[0_16px_34px_rgba(175,166,230,0.14)] backdrop-blur-[16px] transition duration-300 hover:-translate-y-0.5 hover:bg-white/86',
            ]"
          >
            Back to Landing Page
          </RouterLink>

          <RouterLink
            to="/auth/login"
            :class="[
              'inline-flex items-center justify-center rounded-full border border-transparent bg-slate-950 px-6 py-3.5 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-900',
            ]"
          >
            Try Mira on the Web
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.official-noise {
  background-image:
    radial-gradient(circle at 20% 24%, rgb(255 255 255 / 0.88) 0 2px, transparent 3px),
    radial-gradient(circle at 74% 28%, rgb(255 255 255 / 0.78) 0 2px, transparent 3px),
    radial-gradient(circle at 68% 62%, rgb(201 238 255 / 0.56) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 66%, rgb(214 190 255 / 0.42) 0 2px, transparent 3px);
  background-size: 220px 220px;
}
</style>
