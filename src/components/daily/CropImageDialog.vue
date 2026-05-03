<template>
  <v-dialog v-model="open" max-width="600" scrollable persistent>
    <v-card>
      <v-card-title>Crop to nutrition label</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-2">
          Drag inside the box to move it. Drag the corners to resize.
        </p>
        <div class="crop-container">
          <canvas ref="canvasEl" class="crop-canvas" />
          <template v-if="ready">
            <div class="crop-mask" :style="topMask" />
            <div class="crop-mask" :style="bottomMask" />
            <div class="crop-mask" :style="leftMask" />
            <div class="crop-mask" :style="rightMask" />
            <div
              class="crop-rect"
              :style="rectStyle"
              @pointerdown.stop.prevent="startDrag('move', $event)"
            >
              <div class="handle tl" @pointerdown.stop.prevent="startDrag('tl', $event)" />
              <div class="handle tr" @pointerdown.stop.prevent="startDrag('tr', $event)" />
              <div class="handle bl" @pointerdown.stop.prevent="startDrag('bl', $event)" />
              <div class="handle br" @pointerdown.stop.prevent="startDrag('br', $event)" />
            </div>
          </template>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!ready" @click="apply">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
  import { useAppStore } from '@/stores/app'

  const props = defineProps<{ file: File | null }>()
  const open = defineModel<boolean>({ default: false })
  const emit = defineEmits<{ cropped: [imageDataUrl: string] }>()

  const appStore = useAppStore()
  const canvasEl = ref<HTMLCanvasElement | null>(null)
  const ready = ref(false)
  const imgW = ref(0)
  const imgH = ref(0)

  const rect = reactive({ x: 0, y: 0, w: 1, h: 1 })

  let mode: '' | 'move' | 'tl' | 'tr' | 'bl' | 'br' = ''
  let startX = 0
  let startY = 0
  let startRect = { x: 0, y: 0, w: 0, h: 0 }
  const MIN_PX = 24
  const MAX_EDGE = 1024
  const PREVIEW_MAX_EDGE = 1024

  let observer: ResizeObserver | null = null
  let originalBitmap: ImageBitmap | null = null

  const rectStyle = computed(() => ({
    left: rect.x * imgW.value + 'px',
    top: rect.y * imgH.value + 'px',
    width: rect.w * imgW.value + 'px',
    height: rect.h * imgH.value + 'px',
  }))
  const topMask = computed(() => ({
    top: '0',
    left: '0',
    right: '0',
    height: rect.y * imgH.value + 'px',
  }))
  const bottomMask = computed(() => ({
    top: (rect.y + rect.h) * imgH.value + 'px',
    left: '0',
    right: '0',
    bottom: '0',
  }))
  const leftMask = computed(() => ({
    top: rect.y * imgH.value + 'px',
    left: '0',
    width: rect.x * imgW.value + 'px',
    height: rect.h * imgH.value + 'px',
  }))
  const rightMask = computed(() => ({
    top: rect.y * imgH.value + 'px',
    left: (rect.x + rect.w) * imgW.value + 'px',
    right: '0',
    height: rect.h * imgH.value + 'px',
  }))

  watch(open, async (isOpen) => {
    if (!isOpen) {
      ready.value = false
      observer?.disconnect()
      originalBitmap?.close?.()
      originalBitmap = null
      return
    }
    if (props.file) await loadFile(props.file)
  })

  async function loadFile(file: File) {
    ready.value = false
    originalBitmap?.close?.()
    originalBitmap = null

    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      appStore.showSnackbar('Could not read image', 'error')
      open.value = false
      return
    }
    originalBitmap = bitmap

    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = longest > PREVIEW_MAX_EDGE ? PREVIEW_MAX_EDGE / longest : 1
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    await nextTick()
    const canvas = canvasEl.value
    if (!canvas) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(bitmap, 0, 0, w, h)

    rect.x = 0
    rect.y = 0
    rect.w = 1
    rect.h = 1
    attachObserver(canvas)
    ready.value = true
  }

  function attachObserver(canvas: HTMLCanvasElement) {
    observer?.disconnect()
    const sync = () => {
      imgW.value = canvas.clientWidth
      imgH.value = canvas.clientHeight
    }
    sync()
    observer = new ResizeObserver(sync)
    observer.observe(canvas)
  }

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }

  function startDrag(m: typeof mode, e: PointerEvent) {
    if (!ready.value) return
    mode = m
    startX = e.clientX
    startY = e.clientY
    startRect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd, { once: true })
    window.addEventListener('pointercancel', onEnd, { once: true })
  }

  function onMove(e: PointerEvent) {
    const W = imgW.value
    const H = imgH.value
    if (!W || !H) return
    const dxF = (e.clientX - startX) / W
    const dyF = (e.clientY - startY) / H
    const minXF = MIN_PX / W
    const minYF = MIN_PX / H
    if (mode === 'move') {
      rect.x = clamp(startRect.x + dxF, 0, 1 - startRect.w)
      rect.y = clamp(startRect.y + dyF, 0, 1 - startRect.h)
    } else if (mode === 'br') {
      rect.w = clamp(startRect.w + dxF, minXF, 1 - startRect.x)
      rect.h = clamp(startRect.h + dyF, minYF, 1 - startRect.y)
    } else if (mode === 'tl') {
      const nx = clamp(startRect.x + dxF, 0, startRect.x + startRect.w - minXF)
      const ny = clamp(startRect.y + dyF, 0, startRect.y + startRect.h - minYF)
      rect.x = nx
      rect.y = ny
      rect.w = startRect.x + startRect.w - nx
      rect.h = startRect.y + startRect.h - ny
    } else if (mode === 'tr') {
      const ny = clamp(startRect.y + dyF, 0, startRect.y + startRect.h - minYF)
      rect.y = ny
      rect.h = startRect.y + startRect.h - ny
      rect.w = clamp(startRect.w + dxF, minXF, 1 - startRect.x)
    } else if (mode === 'bl') {
      const nx = clamp(startRect.x + dxF, 0, startRect.x + startRect.w - minXF)
      rect.x = nx
      rect.w = startRect.x + startRect.w - nx
      rect.h = clamp(startRect.h + dyF, minYF, 1 - startRect.y)
    }
  }

  function onEnd() {
    mode = ''
    window.removeEventListener('pointermove', onMove)
  }

  onBeforeUnmount(() => {
    observer?.disconnect()
    originalBitmap?.close?.()
    originalBitmap = null
    window.removeEventListener('pointermove', onMove)
  })

  async function apply() {
    if (!ready.value || !originalBitmap) return
    const ow = originalBitmap.width
    const oh = originalBitmap.height
    const sx = Math.round(rect.x * ow)
    const sy = Math.round(rect.y * oh)
    const sw = Math.max(1, Math.round(rect.w * ow))
    const sh = Math.max(1, Math.round(rect.h * oh))

    const longest = Math.max(sw, sh)
    const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1
    const outW = Math.max(1, Math.round(sw * scale))
    const outH = Math.max(1, Math.round(sh * scale))

    const out = document.createElement('canvas')
    out.width = outW
    out.height = outH
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.drawImage(originalBitmap, sx, sy, sw, sh, 0, 0, outW, outH)

    const blob: Blob = await new Promise((resolve, reject) => {
      out.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Crop failed'))),
        'image/jpeg',
        0.85,
      )
    })

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error ?? new Error('Image read failed'))
      reader.readAsDataURL(blob)
    })

    emit('cropped', dataUrl)
    open.value = false
  }

  function cancel() {
    open.value = false
  }
</script>

<style scoped>
.crop-container {
  position: relative;
  max-width: 100%;
  user-select: none;
  touch-action: none;
  line-height: 0;
}
.crop-canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
.crop-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: none;
}
.crop-rect {
  position: absolute;
  border: 2px solid white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6);
  cursor: move;
  touch-action: none;
  box-sizing: border-box;
}
.handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.6);
  touch-action: none;
  box-sizing: border-box;
}
.handle.tl { top: -9px; left: -9px; cursor: nwse-resize; }
.handle.tr { top: -9px; right: -9px; cursor: nesw-resize; }
.handle.bl { bottom: -9px; left: -9px; cursor: nesw-resize; }
.handle.br { bottom: -9px; right: -9px; cursor: nwse-resize; }
</style>
