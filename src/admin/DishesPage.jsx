import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useDishes } from './useDishes'
import { MENU_CATEGORIES } from './adminConfig'
import { removeDishImage } from './storage'
import DishFormModal from './DishFormModal'
import ConfirmDialog from './ConfirmDialog'

const categoryIndex = (c) => {
    const i = MENU_CATEGORIES.indexOf(c)
    return i === -1 ? 999 : i
}

export default function DishesPage() {
    const { user, signOut } = useAuth()
    const { dishes, loading, error, reload, createDish, updateDish, deleteDish } = useDishes()

    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('all')

    const [formOpen, setFormOpen] = useState(false)
    const [editingDish, setEditingDish] = useState(null) 

    const [toDelete, setToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    const [busyId, setBusyId] = useState(null)
    const [notice, setNotice] = useState(null)

    useEffect(() => {
        if (!notice) return
        const t = setTimeout(() => setNotice(null), 4000)
        return () => clearTimeout(t)
    }, [notice])

    const categories = useMemo(() => {
        const extras = [...new Set(dishes.map((d) => d.categoria))].filter((c) => !MENU_CATEGORIES.includes(c))
        return [...MENU_CATEGORIES, ...extras]
    }, [dishes])

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase()
        return dishes
            .filter((d) => filterCat === 'all' || d.categoria === filterCat)
            .filter((d) => !q || `${d.nombre} ${d.descripcion ?? ''}`.toLowerCase().includes(q))
            .sort(
                (a, b) =>
                    categoryIndex(a.categoria) - categoryIndex(b.categoria) ||
                    a.nombre.localeCompare(b.nombre, 'es'),
            )
    }, [dishes, search, filterCat])

    const availableCount = dishes.filter((d) => d.disponible).length

    // ---- acciones ----
    const openNew = () => {
        setEditingDish(null)
        setFormOpen(true)
    }

    const openEdit = (dish) => {
        setEditingDish(dish)
        setFormOpen(true)
    }

    const releaseImage = (url, exceptId) => {
        if (!url) return
        if (dishes.some((d) => d.id !== exceptId && d.imagen === url)) return
        removeDishImage(url)
    }

    const handleSave = async (payload) => {
        if (editingDish) {
            await updateDish(editingDish.id, payload)
            if (editingDish.imagen && editingDish.imagen !== payload.imagen) {
                releaseImage(editingDish.imagen, editingDish.id)
            }
            setNotice({ type: 'ok', text: `«${payload.nombre}» se actualizó correctamente.` })
        } else {
            await createDish(payload)
            setNotice({ type: 'ok', text: `«${payload.nombre}» se creó correctamente.` })
        }
        setFormOpen(false)
    }

    const handleToggle = async (dish) => {
        setBusyId(dish.id)
        try {
            await updateDish(dish.id, { disponible: !dish.disponible })
        } catch (err) {
            setNotice({ type: 'error', text: err.message })
        } finally {
            setBusyId(null)
        }
    }

    const askDelete = (dish) => {
        setDeleteError('')
        setToDelete(dish)
    }

    const confirmDelete = async () => {
        setDeleting(true)
        setDeleteError('')
        try {
            await deleteDish(toDelete.id)
            releaseImage(toDelete.imagen, toDelete.id)
            setNotice({ type: 'ok', text: `«${toDelete.nombre}» se eliminó.` })
            setToDelete(null)
        } catch (err) {
            setDeleteError(err.message)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="min-h-screen w-full bg-neutral-100 text-neutral-900">
            {/* Barra superior */}
            <header className="bg-[#16181a] text-white">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
                    <div>
                        <h1 className="text-lg font-bold">Panel del menú</h1>
                        <p className="text-xs text-neutral-400">Sesión: {user?.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/Menu" className="text-sm text-neutral-300 hover:text-white">
                            Ver menú público
                        </Link>
                        <button
                            type="button"
                            onClick={signOut}
                            className="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm hover:bg-neutral-800"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6">
                {/* Herramientas */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar plato…"
                        aria-label="Buscar plato"
                        className="min-w-[180px] flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        aria-label="Filtrar por categoría"
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={openNew}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#fe741f]"
                    >
                        + Nuevo plato
                    </button>
                </div>

                <p className="mt-3 text-sm text-neutral-500">
                    {dishes.length} platos · {availableCount} disponibles
                    {visible.length !== dishes.length && ` · mostrando ${visible.length}`}
                </p>

                {notice && (
                    <p
                        role="status"
                        className={`mt-3 rounded-lg p-3 text-sm ${
                            notice.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                        }`}
                    >
                        {notice.text}
                    </p>
                )}

                {/* Listado */}
                <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
                    {loading ? (
                        <p className="p-8 text-center text-sm text-neutral-500">Cargando platos…</p>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <p className="text-sm text-red-700">{error}</p>
                            <button type="button" onClick={reload}
                                className="mt-3 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
                                Reintentar
                            </button>
                        </div>
                    ) : visible.length === 0 ? (
                        <p className="p-8 text-center text-sm text-neutral-500">
                            {dishes.length === 0
                                ? 'Todavía no hay platos. Crea el primero con «Nuevo plato».'
                                : 'Ningún plato coincide con la búsqueda.'}
                        </p>
                    ) : (
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Plato</th>
                                    <th className="px-4 py-3 font-medium">Categoría</th>
                                    <th className="px-4 py-3 font-medium">Precio</th>
                                    <th className="px-4 py-3 font-medium">Tiempo</th>
                                    <th className="px-4 py-3 text-center font-medium">Fav.</th>
                                    <th className="px-4 py-3 text-center font-medium">Disponible</th>
                                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {visible.map((d) => (
                                    <tr key={d.id} className={d.disponible ? '' : 'bg-neutral-50 text-neutral-400'}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {d.imagen ? (
                                                    <img src={d.imagen} alt="" loading="lazy"
                                                        className="h-10 w-10 shrink-0 rounded-md bg-neutral-200 object-cover" />
                                                ) : (
                                                    <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-200" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{d.nombre}</p>
                                                    {d.descripcion && (
                                                        <p className="max-w-xs truncate text-xs text-neutral-500">{d.descripcion}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{d.categoria}</td>
                                        <td className="px-4 py-3 tabular-nums">${Number(d.precio).toFixed(2)}</td>
                                        <td className="px-4 py-3">{d.tiempo || '—'}</td>
                                        <td className="px-4 py-3 text-center">{d.favorito ? '★' : ''}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={d.disponible}
                                                aria-label={`Disponibilidad de ${d.nombre}`}
                                                disabled={busyId === d.id}
                                                onClick={() => handleToggle(d)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                                                    d.disponible ? 'bg-primary' : 'bg-neutral-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                        d.disponible ? 'translate-x-5' : 'translate-x-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button type="button" onClick={() => openEdit(d)}
                                                className="mr-2 rounded-md px-2 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                                                Editar
                                            </button>
                                            <button type="button" onClick={() => askDelete(d)}
                                                className="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50">
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {formOpen && (
                <DishFormModal
                    key={editingDish?.id ?? 'nuevo'}
                    dish={editingDish}
                    onSave={handleSave}
                    onClose={() => setFormOpen(false)}
                />
            )}

            {toDelete && (
                <ConfirmDialog
                    title="Eliminar plato"
                    message={`¿Seguro que quieres eliminar «${toDelete.nombre}»? Esta acción no se puede deshacer. Si solo quieres ocultarlo temporalmente, usa el interruptor de «Disponible».`}
                    confirmLabel="Sí, eliminar"
                    busy={deleting}
                    error={deleteError}
                    onConfirm={confirmDelete}
                    onCancel={() => setToDelete(null)}
                />
            )}
        </div>
    )
}
