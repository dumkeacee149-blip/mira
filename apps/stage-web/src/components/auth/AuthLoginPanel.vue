<script setup lang="ts">
import type { OAuthProvider } from '@proj-mira/stage-ui/libs/auth'

import { Button } from '@proj-mira/ui'

const props = defineProps<{
  description: string
  eyebrow: string
  githubLabel: string
  googleLabel: string
  isGithubLoading: boolean
  isGoogleLoading: boolean
  legal: string
  noticeLabel: string
  title: string
}>()

const emit = defineEmits<{
  signIn: [provider: OAuthProvider]
}>()

function handleProvider(provider: OAuthProvider) {
  emit('signIn', provider)
}
</script>

<template>
  <section
    :class="[
      'rounded-[2.6rem] border border-[#0b1728]/10 bg-white/76 px-6 py-7 shadow-[0_18px_60px_rgba(8,17,31,0.1)] backdrop-blur-xl md:px-7 md:py-8',
    ]"
  >
    <p :class="['text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-slate-500']">
      {{ eyebrow }}
    </p>
    <h2 :class="['mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950']">
      {{ title }}
    </h2>
    <p :class="['mt-3 text-sm leading-7 text-slate-600']">
      {{ description }}
    </p>

    <div :class="['mt-7 flex flex-col gap-3']">
      <Button
        :class="['w-full rounded-[1.6rem] py-3 flex items-center justify-center gap-2']"
        :loading="props.isGoogleLoading"
        @click="handleProvider('google')"
      >
        <div v-if="!props.isGoogleLoading" class="i-simple-icons-google" />
        <span>{{ googleLabel }}</span>
      </Button>

      <Button
        :class="['w-full rounded-[1.6rem] py-3 flex items-center justify-center gap-2']"
        :loading="props.isGithubLoading"
        @click="handleProvider('github')"
      >
        <div v-if="!props.isGithubLoading" class="i-simple-icons-github" />
        <span>{{ githubLabel }}</span>
      </Button>
    </div>

    <div
      :class="[
        'mt-6 rounded-[1.6rem] border border-black/6 bg-[#f7efe7] px-4 py-4',
      ]"
    >
      <p :class="['text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500']">
        {{ noticeLabel }}
      </p>
      <p :class="['mt-2 text-sm leading-7 text-slate-600']">
        {{ legal }}
      </p>
    </div>
  </section>
</template>
