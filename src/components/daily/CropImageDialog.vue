<template>
  <v-dialog v-model="open" max-width="600" scrollable persistent>
    <v-card>
      <v-card-title>Crop to nutrition label</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-2">
          Drag inside the box to move it. Drag the corners to resize.
        </p>
        <div class="crop-container">
          <img
            ref="imgEl"
            :src="imageDataUrl"
            class="crop-img"
            draggable="false"
            @load="onImageLoad"
          >
          <template v-if="loaded">
            <div class="crop-mask" :style="{ top: 0, left: 0, right: 0, height: rect.y + 'px' }" />
            <div class="crop-mask" :style="{ top: (rect.y + rect.h) + 'px', left: 0, right: 0, bottom: 0 }" />
            <div class="crop-mask" :style="{ top: rect.y + 'px', left: 0, width: rect.x + 'px', height: rect.h + 'px' }" />
            <div class="crop-mask" :style="{ top: rect.y + 'px', left: (rect.x + rect.w) + 'px', right: 0, height: rect.h + 'px' }" />
            <div
              class="crop-rect"
              :style="{ left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px' }"
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
        <v-btn color="primary" variant="flat" :disabled="!loaded" @click="apply">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch } from 'vue'

  defineProps<{ imageDataUrl: string }>()
  const open = defineModel<boolean>({ default: false })
  const emit = defineEmits<{ cropped: [imageDataUrl: string] }>()

  const imgEl = ref<HTMLImageElement | null>(null)
  const loaded = ref(false)
  const rect = reactive({ x: 0, y: 0, w: 0, h: 0 })

  let mode: '' | 'move' | 'tl' | 'tr' | 'bl' | 'br' = ''
  let startX = 0
  let startY = 0
  let startRect = { x: 0, y: 0, w: 0, h: 0 }
  const MIN = 24

  watch(open, (v) => {
    if (!v) loaded.value = false
  })

  function onImageLoad() {
    const img = imgEl.value
    if (!img) return
    rect.x = 0
    rect.y = 0
    rect.w = img.clientWidth
    rect.h = img.clientHeight
    loaded.value = true
  }

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
  }

  function startDrag(m: typeof mode, e: PointerEvent) {
    if (!loaded.value) return
    mode = m
    startX = e.clientX
    startY = e.clientY
    startRect = { ...rect }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd, { once: true })
    window.addEventListener('pointercancel', onEnd, { once: true })
  }

  function onMove(e: PointerEvent) {
    const img = imgEl.value
    if (!img) return
    const W = img.clientWidth
    const H = img.clientHeight
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (mode === 'move') {
      rect.x = clamp(startRect.x + dx, 0, W - startRect.w)
      rect.y = clamp(startRect.y + dy, 0, H - startRect.h)
    } else if (mode === 'br') {
      rect.w = clamp(startRect.w + dx, MIN, W - startRect.x)
      rect.h = clamp(startRect.h + dy, MIN, H - startRect.y)
    } else if (mode === 'tl') {
      const nx = clamp(startRect.x + dx, 0, startRect.x + startRect.w - MIN)
      const ny = clamp(startRect.y + dy, 0, startRect.y + startRect.h - MIN)
      rect.x = nx
      rect.y = ny
      rect.w = startRect.x + startRect.w - nx
      rect.h = startRect.y + startRect.h - ny
    } else if (mode === 'tr') {
      const ny = clamp(startRect.y + dy, 0, startRect.y + startRect.h - MIN)
      rect.y = ny
      rect.h = startRect.y + startRect.h - ny
      rect.w = clamp(startRect.w + dx, MIN, W - startRect.x)
    } else if (mode === 'bl') {
      const nx = clamp(startRect.x + dx, 0, startRect.x + startRect.w - MIN)
      rect.x = nx
      rect.w = startRect.x + startRect.w - nx
      rect.h = clamp(startRect.h + dy, MIN, H - startRect.y)
    }
  }

  function onEnd() {
    mode = ''
    window.removeEventListener('pointermove', onMove)
  }

  async function apply() {
    const img = imgEl.value
    if (!img) return
    const scaleX = img.naturalWidth / img.clientWidth
    const scaleY = img.naturalHeight / img.clientHeight
    const sx = Math.round(rect.x * scaleX)
    const sy = Math.round(rect.y * scaleY)
    const sw = Math.max(1, Math.round(rect.w * scaleX))
    const sh = Math.max(1, Math.round(rect.h * scaleY))

    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
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
.crop-img {
  display: block;
  max-width: 100%;
  height: auto;
  -webkit-user-drag: none;
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
