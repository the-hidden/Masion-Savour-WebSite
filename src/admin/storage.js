import { supabase } from './supabaseClient'
import { SUPABASE_URL } from '../Config'
import { IMAGES_BUCKET } from './adminConfig'
import { compressImage, pathFromPublicUrl, uniqueFileName, validateImageFile } from './imageUtils'

// Todas las URLs públicas de nuestro bucket empiezan así.
const PUBLIC_PREFIX = `${(SUPABASE_URL || '').replace(/\/+$/, '')}/storage/v1/object/public/${IMAGES_BUCKET}/`

// Traduce los errores de Storage a mensajes para el empleado.
function friendlyStorageError(error) {
    const status = String(error.statusCode ?? error.status ?? '')
    const message = (error.message || '').toLowerCase()

    if (message.includes('bucket not found')) {
        return `Falta crear el bucket "${IMAGES_BUCKET}". Ejecuta supabase/storage_setup.sql en Supabase.`
    }
    if (status === '413' || message.includes('maximum allowed size') || message.includes('too large')) {
        return 'La imagen es demasiado grande para el servidor (máximo 2 MB después de optimizarla).'
    }
    if (message.includes('mime type') || message.includes('not supported')) {
        return 'El servidor no aceptó el formato de la imagen.'
    }
    if (status === '401' || status === '403' || message.includes('row-level security') || message.includes('unauthorized')) {
        return 'No tienes permiso para subir imágenes. Verifica que tu cuenta sea de empleado y vuelve a iniciar sesión.'
    }
    return error.message || 'No se pudo subir la imagen.'
}

// SUBIR: valida -> optimiza -> sube con nombre único -> devuelve la URL pública.
// Esa URL es la que se guarda en la columna "imagen" de la tabla del menú.
export async function uploadDishImage(file) {
    const problem = validateImageFile(file)
    if (problem) throw new Error(problem)

    const { blob, ext } = await compressImage(file)
    const path = uniqueFileName(ext)

    const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, blob, {
        contentType: blob.type,
        // El nombre es único y nunca se reutiliza, así que el navegador puede guardarla un año.
        cacheControl: '31536000',
        upsert: false, // si el nombre ya existiera, falla en vez de pisar otra imagen
    })
    if (error) throw new Error(friendlyStorageError(error))

    const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path)
    return data.publicUrl
}

// BORRAR: elimina el archivo de una URL, solo si es de nuestro bucket.
// Es "mejor esfuerzo": si falla, no interrumpe nada (como máximo queda un archivo huérfano).
export async function removeDishImage(url) {
    const path = pathFromPublicUrl(url, PUBLIC_PREFIX)
    if (!path) return // enlace externo o ruta local: no es nuestro, no se toca
    try {
        const { error } = await supabase.storage.from(IMAGES_BUCKET).remove([path])
        if (error) console.warn('No se pudo borrar la imagen anterior:', error.message)
    } catch (err) {
        console.warn('No se pudo borrar la imagen anterior:', err.message)
    }
}
