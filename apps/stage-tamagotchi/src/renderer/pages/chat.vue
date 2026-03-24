<script setup lang="ts">
import { useChatSessionStore } from '@proj-mira/stage-ui/stores/chat/session-store'
import { computed } from 'vue'

import InteractiveArea from '../components/InteractiveArea.vue'

const chatSessionStore = useChatSessionStore()
const hasHistory = computed(() => chatSessionStore.messages.length > 0)
</script>

<template>
  <section class="h-full w-full p-2">
    <div v-if="!hasHistory" class="mb-2 border border-neutral-700 rounded-xl border-dashed p-4 text-sm text-neutral-300">
      <div class="mb-1 text-base text-neutral-100 font-semibold">
        欢迎使用 Mira
      </div>
      <p>点击下方输入框开始对话，支持文字、图片输入；右侧状态区可快速跳转设置与控件。</p>
    </div>

    <InteractiveArea
      class="interaction-area block h-full w-full p-2"
      transition="opacity duration-250"
    />
  </section>
</template>

<route lang="yaml">
meta:
  layout: stage
</route>
