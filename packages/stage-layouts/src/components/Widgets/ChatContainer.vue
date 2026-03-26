<template>
  <div
    :class="[
      'relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-[#dbe7f4]',
      'bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(245,250,255,0.96))]',
      'shadow-[0_22px_60px_rgba(119,150,191,0.12)] backdrop-blur-[22px]',
    ]"
  >
    <div
      :class="[
        'pointer-events-none absolute inset-0',
        'bg-[radial-gradient(circle_at_top,_rgba(232,242,255,1),_transparent_42%)]',
      ]"
    />
    <slot />
  </div>
</template>
