<script setup lang="ts">
import { isStageCapacitor, isStageTamagotchi } from '@proj-mira/stage-shared'
import { AboutContent, AboutDialog } from '@proj-mira/stage-ui/components'
import { useBuildInfo } from '@proj-mira/stage-ui/composables'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const show = ref(false)
const buildInfo = useBuildInfo()

const aboutLinks = [
  { label: 'Home', href: 'https://mira.local/docs/', icon: 'i-solar:home-smile-outline' },
  { label: 'Documentations', href: 'https://mira.local/docs/en/docs/overview/', icon: 'i-solar:document-add-outline' },
  { label: 'GitHub', href: 'https://github.com/dumkeacee149-blip/mira', icon: 'i-simple-icons:github' },
]

const edition = isStageTamagotchi()
  ? t('base.edition.desktop')
  : isStageCapacitor()
    ? t('base.edition.mobile')
    : t('base.edition.web')
</script>

<template>
  <button
    type="button"
    :class="[
      'inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e5f4]',
      'bg-white/86 text-[#6e88aa] shadow-[0_18px_38px_rgba(119,150,191,0.12)] backdrop-blur-[22px]',
      'transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd3ea] hover:bg-white hover:text-slate-900',
    ]"
    title="About"
    @click="show = !show"
  >
    <div class="i-solar:info-circle-outline text-lg" />
  </button>
  <AboutDialog v-model="show">
    <AboutContent :subtitle="edition" :build-info="buildInfo" :links="aboutLinks" />
  </AboutDialog>
</template>
