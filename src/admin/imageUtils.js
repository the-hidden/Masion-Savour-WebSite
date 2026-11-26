import { IMAGE_MAX_UPLOAD_MB, IMAGE_MAX_DIMENSION, IMAGE_QUALITY } from './adminConfig'

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function validateImageFile(file) {
    if (!file) return 'No se seleccionó ningún archivo.'
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'Formato no permitido. Usa una imagen JPG, PNG, WebP o AVIF.'
    }
    if (file.size > IMAGE_MAX_UPLOAD_MB * 1024 * 1024) {
        return `La imagen pesa demasiado (máximo ${IMAGE_MAX_UPLOAD_MB} MB).`
    }
    return ''
}

const toBlob = (canvas, type, quality) =>
    new Promise((resolve) => canvas.toBlob(resolve, type, quality))

export async function compressImage(file) {
    let bitmap
    try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
        try {
            bitmap = await createImageBitmap(file)
        } catch {
            throw new Error('No se pudo leer la imagen. Puede estar dañada.')
        }
    }

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    let blob = await toBlob(canvas, 'image/webp', IMAGE_QUALITY)
    if (!blob || blob.type !== 'image/webp') {
        ctx.globalCompositeOperation = 'destination-over'
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        blob = await toBlob(canvas, 'image/jpeg', IMAGE_QUALITY)
    }
    if (!blob) throw new Error('No se pudo procesar la imagen.')

    return { blob, ext: blob.type === 'image/webp' ? 'webp' : 'jpg' }
}

export function uniqueFileName(ext) {
    const id =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    return `${id}.${ext}`
}

export function pathFromPublicUrl(url, publicPrefix) {
    if (!url || !url.startsWith(publicPrefix)) return null
    const rest = url.slice(publicPrefix.length).split('?')[0]
    if (!rest) return null
    try {
        return decodeURIComponent(rest)
    } catch {
        return null
    }
}
