import { breakpointsTailwind, useBreakpoints, useMouse, useWindowScroll, useWindowSize } from '@vueuse/core'
import { computed } from 'vue'

export function useLandingShowcase() {
  const { y } = useWindowScroll()
  const { width, height } = useWindowSize()
  const pointer = useMouse()
  const breakpoints = useBreakpoints(breakpointsTailwind)
  const isMobile = breakpoints.smaller('md')

  const heroProgress = computed(() => Math.min(y.value / 680, 1))
  const pointerOffsetX = computed(() => {
    const viewportWidth = width.value || 1
    return ((pointer.x.value || viewportWidth / 2) / viewportWidth - 0.5) * 34
  })
  const pointerOffsetY = computed(() => {
    const viewportHeight = height.value || 1
    return ((pointer.y.value || viewportHeight / 2) / viewportHeight - 0.5) * 24
  })

  const heroDeviceStyle = computed(() => {
    const progress = heroProgress.value
    return {
      transform: `translate3d(${pointerOffsetX.value}px, ${pointerOffsetY.value - progress * 36}px, 0) scale(${1 - progress * 0.04})`,
    }
  })

  const ambientGlowStyle = computed(() => ({
    transform: `translate3d(${pointerOffsetX.value * -1.3}px, ${pointerOffsetY.value * -1.3}px, 0)`,
  }))

  const stickyStageStyle = computed(() => ({
    transform: `translate3d(${pointerOffsetX.value * 0.65}px, ${pointerOffsetY.value * 0.45}px, 0)`,
  }))

  return {
    ambientGlowStyle,
    heroDeviceStyle,
    isMobile,
    pointer,
    stickyStageStyle,
  }
}
