const MAX_EDGE = 1024
const JPEG_QUALITY = 0.85

export async function resizeAndEncodeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const longest = Math.max(width, height)
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close?.()

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })

  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Image read failed'))
    reader.readAsDataURL(blob)
  })
}
