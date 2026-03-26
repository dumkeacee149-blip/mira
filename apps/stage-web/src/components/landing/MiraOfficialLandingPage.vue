<script setup lang="ts">
import type { DesktopDownloadTarget } from '../../composables/use-desktop-downloads'

import { RouterLink } from 'vue-router'

import LogoAsset from '../../assets/logo.svg'
import MiraOfficialCharacterPreview from './MiraOfficialCharacterPreview.vue'
import MiraOfficialDesktopDownloadCard from './MiraOfficialDesktopDownloadCard.vue'

defineProps<{
  characterDescription: string
  characterGreeting: string
  characterName: string
  characterTagline: string
  characterTags: readonly string[]
  desktopDownloads: readonly DesktopDownloadTarget[]
  isMobile: boolean
}>()
</script>

<template>
  <div
    :class="[
      'official-shell relative min-h-screen overflow-hidden px-4 pb-10 pt-4 text-slate-950 md:px-8 md:pb-16 md:pt-6',
    ]"
  >
    <div :class="['pointer-events-none absolute inset-0 official-noise opacity-80']" />
    <div :class="['pointer-events-none absolute left-[-14rem] top-[-9rem] h-[26rem] w-[26rem] rounded-full bg-[#dbaeff]/42 blur-[110px] md:h-[34rem] md:w-[34rem]']" />
    <div :class="['pointer-events-none absolute right-[-10rem] top-[3rem] h-[22rem] w-[22rem] rounded-full bg-[#bfeeff]/66 blur-[115px] md:h-[30rem] md:w-[30rem]']" />
    <div :class="['pointer-events-none absolute inset-x-0 bottom-[-14rem] mx-auto h-[28rem] w-[80%] rounded-full bg-white/58 blur-[120px]']" />

    <header :class="['relative z-10 mx-auto flex max-w-[1220px] items-start justify-between gap-4']">
      <RouterLink
        to="/"
        :class="['rounded-full border border-white/38 bg-white/42 px-3 py-2 shadow-[0_18px_40px_rgba(175,166,230,0.16)] backdrop-blur-[18px]']"
      >
        <img
          :src="LogoAsset"
          alt="MIRA"
          :class="['h-10 w-auto md:h-14']"
        >
      </RouterLink>

      <div
        v-if="isMobile"
        :class="['relative flex items-start']"
      >
        <RouterLink
          to="/settings"
          :class="[
            'grid h-12 w-12 place-items-center rounded-full border border-white/55 bg-white/58 shadow-[0_16px_50px_rgba(183,173,231,0.24)] backdrop-blur-[22px] transition duration-300 hover:-translate-y-0.5 hover:bg-white/74',
          ]"
          aria-label="Open settings"
        >
          <span :class="['i-lucide-menu h-5 w-5 text-slate-900']" />
        </RouterLink>
      </div>
    </header>

    <main :class="['relative z-10 mx-auto max-w-[1220px] pt-6 md:pt-10']">
      <div
        :class="[
          'flex flex-col-reverse gap-10 md:grid md:grid-cols-[minmax(0,0.82fr)_minmax(22rem,1fr)] md:items-center md:gap-10',
        ]"
      >
        <section :class="['relative order-2 max-w-[39rem] md:order-1 md:pt-4']">
          <div
            :class="[
              'pointer-events-none absolute left-[-2rem] top-[-2rem] hidden h-24 w-24 rounded-full bg-white/80 blur-[32px] md:block',
            ]"
          />

          <div
            :class="[
              'inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/62 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-slate-700 shadow-[0_16px_40px_rgba(175,166,230,0.14)] backdrop-blur-[16px]',
            ]"
          >
            <span :class="['h-2 w-2 rounded-full bg-[linear-gradient(90deg,#ca79ff_0%,#78c7ff_100%)]']" />
            Featured Persona
            <span :class="['tracking-[0.14em] text-slate-900']">{{ characterName }}</span>
          </div>

          <h1 :class="['hero-title text-center text-[3.35rem] leading-[0.94] tracking-[-0.06em] text-slate-950 md:text-left md:text-[5.45rem]']">
            <span :class="['block']">Experience Your <span class="hero-accent">AI</span></span>
            <span :class="['block']"><span class="hero-accent">Companion</span> in a Whole</span>
            <span :class="['block']">New Way.</span>
          </h1>

          <p :class="['mx-auto mt-5 max-w-[32rem] text-center text-[1.05rem] leading-8 text-slate-800/86 md:mx-0 md:mt-6 md:text-left md:text-[1.08rem]']">
            {{ characterDescription }}
          </p>

          <div
            :class="[
              'mt-5 flex flex-wrap justify-center gap-2 md:justify-start',
            ]"
          >
            <span
              v-for="tag in characterTags"
              :key="tag"
              :class="[
                'rounded-full border border-white/55 bg-white/58 px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.18em] text-slate-700 shadow-[0_14px_30px_rgba(175,166,230,0.12)] backdrop-blur-[16px]',
              ]"
            >
              {{ tag }}
            </span>
          </div>

          <div :class="['mt-8 flex flex-col gap-4']">
            <div
              :class="[
                'flex justify-center',
              ]"
            >
              <RouterLink
                to="/auth/login"
                :class="[
                  'inline-flex items-center justify-center rounded-full bg-[linear-gradient(90deg,#ca79ff_0%,#78c7ff_100%)] px-8 py-4 text-lg tracking-[0.22em] text-white shadow-[0_18px_48px_rgba(154,123,255,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(120,199,255,0.32)]',
                ]"
              >
                Try for Free
              </RouterLink>
            </div>

            <div
              id="desktop-downloads"
              :class="[
                'grid gap-3 md:grid-cols-2',
              ]"
            >
              <MiraOfficialDesktopDownloadCard
                v-for="download in desktopDownloads"
                :key="download.id"
                :download="download"
              />
            </div>
          </div>

          <p
            v-if="!isMobile"
            :class="['mt-5 text-sm text-slate-700/72']"
          >
            Desktop packages are now split into dedicated Windows and macOS installers.
          </p>
        </section>

        <section :class="['relative order-1 flex justify-center md:order-2 md:justify-end']">
          <MiraOfficialCharacterPreview
            :character-description="characterDescription"
            :character-greeting="characterGreeting"
            :character-name="characterName"
            :character-tagline="characterTagline"
          />
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.official-shell {
  background:
    radial-gradient(circle at 12% 14%, rgb(220 177 255 / 40%), transparent 18%),
    radial-gradient(circle at 84% 12%, rgb(194 238 255 / 58%), transparent 18%),
    radial-gradient(circle at 50% 55%, rgb(255 255 255 / 74%), transparent 32%),
    linear-gradient(180deg, #f9f5ff 0%, #f5f3ff 34%, #f9fbff 68%, #fffdfd 100%);
}

.official-noise {
  background-image:
    radial-gradient(circle at 20% 24%, rgb(255 255 255 / 0.88) 0 2px, transparent 3px),
    radial-gradient(circle at 74% 28%, rgb(255 255 255 / 0.78) 0 2px, transparent 3px),
    radial-gradient(circle at 68% 62%, rgb(201 238 255 / 0.56) 0 2px, transparent 3px),
    radial-gradient(circle at 30% 66%, rgb(214 190 255 / 0.42) 0 2px, transparent 3px);
  background-size: 220px 220px;
}

.hero-title {
  font-family: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif;
}

.hero-accent {
  background: linear-gradient(135deg, #b474ff 0%, #8f89ff 34%, #78cfff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@media (max-width: 767px) {
  .official-shell {
    background:
      radial-gradient(circle at 18% 12%, rgb(220 177 255 / 46%), transparent 20%),
      radial-gradient(circle at 82% 10%, rgb(194 238 255 / 66%), transparent 18%),
      radial-gradient(circle at 50% 54%, rgb(255 255 255 / 84%), transparent 28%),
      linear-gradient(180deg, #fbf7ff 0%, #f4f2ff 42%, #fefeff 100%);
  }
}
</style>
