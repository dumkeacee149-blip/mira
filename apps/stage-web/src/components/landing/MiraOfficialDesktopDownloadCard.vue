<script setup lang="ts">
import type { DesktopDownloadTarget } from '../../composables/use-desktop-downloads'

defineProps<{
  download: DesktopDownloadTarget
}>()
</script>

<template>
  <RouterLink
    :to="download.pageHref"
    :class="[
      'group relative overflow-hidden rounded-[1.85rem] border px-5 py-5 text-left transition duration-300 md:px-6 md:py-6',
      download.isRecommended
        ? 'border-white/72 bg-white/78 shadow-[0_22px_54px_rgba(145,129,229,0.2)]'
        : 'border-white/58 bg-white/56 shadow-[0_18px_42px_rgba(175,166,230,0.14)]',
      'backdrop-blur-[18px] hover:-translate-y-0.5 hover:bg-white/84',
    ]"
  >
    <div
      :class="[
        'pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100',
        download.isRecommended
          ? 'bg-[radial-gradient(circle_at_top_right,rgba(120,199,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(202,121,255,0.18),transparent_44%)]'
          : 'bg-[radial-gradient(circle_at_top_right,rgba(120,199,255,0.14),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(202,121,255,0.12),transparent_42%)]',
      ]"
    />

    <div :class="['relative z-10 flex items-start justify-between gap-4']">
      <div>
        <p :class="['text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-slate-600']">
          {{ download.statusLabel }}
        </p>
        <h3 :class="['mt-3 text-[1.3rem] font-semibold tracking-[-0.04em] text-slate-950']">
          {{ download.label }}
        </h3>
        <p :class="['mt-2 text-sm leading-6 text-slate-700/82']">
          {{ download.description }}
        </p>
      </div>

      <div
        :class="[
          'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-slate-900 transition duration-300',
          download.isRecommended
            ? 'border-white/70 bg-white/82 shadow-[0_14px_30px_rgba(145,129,229,0.18)]'
            : 'border-white/58 bg-white/70',
        ]"
      >
        <span :class="[download.icon, 'h-5 w-5']" />
      </div>
    </div>

    <div :class="['relative z-10 mt-5 flex items-center justify-between gap-4']">
      <span :class="['rounded-full border border-white/65 bg-white/72 px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.18em] text-slate-700']">
        {{ download.fileLabel }}
      </span>
      <span :class="['inline-flex items-center gap-2 text-sm font-medium text-slate-900']">
        Direct download
        <span :class="['i-lucide-arrow-right h-4 w-4 transition duration-300 group-hover:translate-x-0.5']" />
      </span>
    </div>
  </RouterLink>
</template>
