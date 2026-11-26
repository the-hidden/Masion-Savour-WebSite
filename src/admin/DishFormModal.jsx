import { useEffect, useState } from 'react'
import { MENU_CATEGORIES, IMAGE_MAX_UPLOAD_MB } from './adminConfig'
import { ACCEPTED_TYPES, validateImageFile } from './imageUtils'
import { uploadDishImage, removeDishImage } from './storage'

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 ' +
    'placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

const EMPTY_FORM = {
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: MENU_CATEGORIES[0],
    tiempo: '',
    imagen: '',
    favorito: false,
    disponible: true,
}

export default function DishFormModal({ dish, onSave, onClose }) {
    const [form, setForm] = useState(() =>
        dish
            ? {
                nombre: dish.nombre ?? '',
                descripcion: dish.descripcion ?? '',
                precio: String(dish.precio ?? ''),
                categoria: dish.categoria ?? MENU_CATEGORIES[0],
                tiempo: dish.tiempo ?? '',
                imagen: dish.imagen ?? '',
                favorito: Boolean(dish.favorito),
                disponible: dish.disponible ?? true,
            }
            : EMPTY_FORM,
    )
    const [pending, setPending] = useState(null)
    const [saving, setSaving] = useState(false)
    const [stage, setStage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !saving) onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [saving, onClose])

    useEffect(() => {
        return () => {
            if (pending) URL.revokeObjectURL(pending.url)
        }
    }, [pending])

    const set = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const categories = MENU_CATEGORIES.includes(form.categoria)
        ? MENU_CATEGORIES
        : [...MENU_CATEGORIES, form.categoria]

    const handleFile = (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        const problem = validateImageFile(file)
        if (problem) {
            setError(problem)
            return
        }
        setError('')
        setPending({ file, url: URL.createObjectURL(file) })
    }

    const removeImage = () => {
        setPending(null)
        setForm((prev) => ({ ...prev, imagen: '' }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const nombre = form.nombre.trim()
        const precio = Number(form.precio)
        let imagen = form.imagen.trim()

        if (!nombre) return setError('El nombre es obligatorio.')
        if (form.precio === '' || Number.isNaN(precio) || precio < 0) {
            return setError('Escribe un precio válido (0 o mayor).')
        }
        if (!pending && imagen && !/^(https?:\/\/|\/)/i.test(imagen)) {
            return setError('El enlace de la imagen debe empezar con https:// (o con /).')
        }

        setSaving(true)
        setError('')
        let uploadedUrl = null
        try {
            if (pending) {
                setStage('upload')
                uploadedUrl = await uploadDishImage(pending.file)
                imagen = uploadedUrl
            }
            setStage('save')
            await onSave({
                nombre,
                descripcion: form.descripcion.trim() || null,
                precio: Math.round(precio * 100) / 100,
                categoria: form.categoria,
                tiempo: form.tiempo.trim() || null,
                imagen: imagen || null,
                favorito: form.favorito,
                disponible: form.disponible,
            })
        } catch (err) {
            if (uploadedUrl) await removeDishImage(uploadedUrl)
            setError(err.message)
            setSaving(false)
            setStage('')
        }
    }

    const shownImage = pending ? pending.url : form.imagen.trim()
    const buttonLabel =
        stage === 'upload' ? 'Subiendo imagen…' : saving ? 'Guardando…' : dish ? 'Guardar cambios' : 'Crear plato'

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) onClose()
            }}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="dish-form-title"
                onSubmit={handleSubmit}
                noValidate
                className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >
                <h2 id="dish-form-title" className="text-lg font-semibold text-neutral-900">
                    {dish ? 'Editar plato' : 'Nuevo plato'}
                </h2>

                <div className="mt-5 space-y-4">
                    <div>
                        <label htmlFor="f-nombre" className="mb-1 block text-sm font-medium text-neutral-700">
                            Nombre *
                        </label>
                        <input id="f-nombre" type="text" value={form.nombre} onChange={set('nombre')}
                            className={inputClass} autoFocus />
                    </div>

                    <div>
                        <label htmlFor="f-descripcion" className="mb-1 block text-sm font-medium text-neutral-700">
                            Descripción
                        </label>
                        <textarea id="f-descripcion" rows={3} value={form.descripcion} onChange={set('descripcion')}
                            className={inputClass} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="f-precio" className="mb-1 block text-sm font-medium text-neutral-700">
                                Precio ($) *
                            </label>
                            <input id="f-precio" type="number" inputMode="decimal" min="0" step="0.01"
                                value={form.precio} onChange={set('precio')} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="f-tiempo" className="mb-1 block text-sm font-medium text-neutral-700">
                                Tiempo
                            </label>
                            <input id="f-tiempo" type="text" value={form.tiempo} onChange={set('tiempo')}
                                placeholder="10 min" className={inputClass} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="f-categoria" className="mb-1 block text-sm font-medium text-neutral-700">
                            Categoría *
                        </label>
                        <select id="f-categoria" value={form.categoria} onChange={set('categoria')} className={inputClass}>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <span className="mb-1 block text-sm font-medium text-neutral-700">Foto del plato</span>
                        <div className="flex items-center gap-4">
                            {shownImage ? (
                                <img src={shownImage} alt="Vista previa"
                                    className="h-24 w-24 shrink-0 rounded-lg bg-neutral-200 object-cover" />
                            ) : (
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">
                                    Sin foto
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="inline-block cursor-pointer rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 focus-within:ring-2 focus-within:ring-primary/30 hover:bg-neutral-50">
                                    {shownImage ? 'Cambiar foto' : 'Elegir foto'}
                                    <input type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFile}
                                        disabled={saving} className="sr-only" />
                                </label>
                                {shownImage && (
                                    <button type="button" onClick={removeImage} disabled={saving}
                                        className="ml-2 text-sm text-red-600 hover:underline disabled:opacity-60">
                                        Quitar
                                    </button>
                                )}
                                <p className="text-xs text-neutral-500">
                                    JPG, PNG, WebP o AVIF, hasta {IMAGE_MAX_UPLOAD_MB} MB. Se optimiza automáticamente.
                                </p>
                            </div>
                        </div>

                        <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-800">
                                ¿Prefieres pegar un enlace?
                            </summary>
                            <input type="text" value={form.imagen} placeholder="https://…" aria-label="Enlace de la imagen"
                                onChange={(e) => {
                                    setPending(null)
                                    set('imagen')(e)
                                }}
                                className={`${inputClass} mt-2`} />
                        </details>
                    </div>

                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 text-sm text-neutral-700">
                            <input type="checkbox" checked={form.disponible} onChange={set('disponible')}
                                className="h-4 w-4 accent-primary" />
                            Disponible en el menú
                        </label>
                        <label className="flex items-center gap-2 text-sm text-neutral-700">
                            <input type="checkbox" checked={form.favorito} onChange={set('favorito')}
                                className="h-4 w-4 accent-primary" />
                            Plato favorito
                        </label>
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={saving}
                        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#fe741f] disabled:cursor-not-allowed disabled:opacity-60">
                        {buttonLabel}
                    </button>
                </div>
            </form>
        </div>
    )
}
