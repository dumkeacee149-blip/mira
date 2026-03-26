<script setup lang="ts">
import type { AuthLoginDetail } from './types'

import LogoAsset from '../../assets/logo.svg'

import { miraCharacterPortrait } from '../../assets/mira-character'

defineProps<{
  brandLabel: string
  description: string
  details: AuthLoginDetail[]
  eyebrow: string
  posterCaption: string
  posterLabel: string
  title: string
}>()
</script>

<template>
  <section
    :class="[
      'relative overflow-hidden rounded-[3rem] border border-[#f1d1be]',
      'bg-[linear-gradient(180deg,#fff8fc_0%,#f7e7ee_58%,#f8e6da_100%)] text-slate-950 shadow-[0_32px_110px_rgba(120,64,26,0.14)]',
    ]"
  >
    <div :class="['pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.86),_transparent_24%),radial-gradient(circle_at_82%_26%,_rgba(236,72,153,0.14),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(255,156,114,0.12),_transparent_24%)]']" />

    <div :class="['relative z-10 flex h-full flex-col justify-between gap-10 p-6 md:p-8 xl:p-10']">
      <div :class="['max-w-[34rem]']">
        <div :class="['flex items-center gap-4']">
          <img :src="LogoAsset" alt="MIRA logo" :class="['h-14 w-14 rounded-[1.4rem] shadow-[0_16px_32px_rgba(8,17,31,0.12)]']">
          <div>
            <p :class="['text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-slate-500']">
              MIRA
            </p>
            <p :class="['mt-1 text-sm font-medium tracking-[0.12em] text-slate-700']">
              {{ brandLabel }}
            </p>
          </div>
        </div>

        <p :class="['mt-8 text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-slate-500']">
          {{ eyebrow }}
        </p>
        <h1 :class="['mt-4 max-w-[12ch] text-5xl leading-[0.92] font-semibold tracking-[-0.07em] md:text-6xl']">
          {{ title }}
        </h1>
        <p :class="['mt-5 max-w-2xl text-lg leading-8 text-slate-700']">
          {{ description }}
        </p>
      </div>

      <div :class="['grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(22rem,1fr)] lg:items-end']">
        <div :class="['space-y-4']">
          <article
            v-for="detail in details"
            :key="detail.title"
            :class="[
              'border-t border-black/8 pt-4 first:border-t-0 first:pt-0',
            ]"
          >
            <p :class="['text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-500']">
              {{ detail.title }}
            </p>
            <p :class="['mt-2 text-sm leading-7 text-slate-700']">
              {{ detail.body }}
            </p>
          </article>
        </div>

        <div :class="['relative mx-auto w-full max-w-[26rem]']">
          <div
            :class="[
              'relative overflow-hidden rounded-[2.2rem] border border-[#0a1830]/10 bg-[linear-gradient(180deg,#24172e_0%,#121b2f_72%,#10182d_100%)] pt-6 shadow-[0_28px_90px_rgba(15,23,42,0.22)] md:pt-8',
            ]"
          >
            <div :class="['absolute inset-x-[18%] bottom-[-3rem] h-[7rem] rounded-full bg-[#ffb0d2]/34 blur-[70px]']" />
            <div :class="['absolute right-5 top-5 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.26em] text-[#ffd5eb]']">
              {{ posterLabel }}
            </div>
            <div :class="['relative z-10 flex items-end justify-center px-5']">
              <img
                :src="miraCharacterPortrait"
                alt="MIRA portrait"
                :class="['h-[32rem] max-w-full object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.3)] md:h-[38rem]']"
              >
            </div>
            <div :class="['relative z-10 border-t border-white/8 bg-slate-950/42 px-5 py-4 text-sm leading-7 text-white/76 backdrop-blur-xl']">
              {{ posterCaption }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
