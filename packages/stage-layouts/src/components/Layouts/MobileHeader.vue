<script setup lang="ts">
import HeaderAvatar from './HeaderAvatar.vue'
import MobileHeaderLink from './MobileHeaderLink.vue'
</script>

<template>
  <header
    :class="[
      'mb-1 flex w-full items-center justify-between gap-3 rounded-full border border-white/16',
      'bg-[#07111f]/68 px-2 py-2 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-[22px]',
    ]"
  >
    <MobileHeaderLink />
    <HeaderAvatar />
  </header>
</template>
