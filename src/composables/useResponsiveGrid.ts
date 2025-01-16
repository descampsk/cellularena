import { ref, onMounted, onUnmounted, computed } from 'vue'

export function useResponsiveGrid(width: number, height: number) {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  const handleResize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  const cellSize = computed(() => {
    const availableWidth = windowWidth.value * 0.8
    const availableHeight = windowHeight.value * 0.65

    const cellSizeFromWidth = Math.floor(availableWidth / width)
    const cellSizeFromHeight = Math.floor(availableHeight / height)

    return Math.min(cellSizeFromWidth, cellSizeFromHeight)
  })

  const canvasWidth = computed(() => cellSize.value * width)
  const canvasHeight = computed(() => cellSize.value * height)

  return {
    cellSize,
    canvasWidth,
    canvasHeight,
  }
}
