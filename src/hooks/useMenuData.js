import { useEffect, useState } from 'react'
import axios from 'axios'
import { menuData as fallbackData } from '../data/mockData'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_MENU_TABLE } from '../Config'

const CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
const REFRESH_MS = 60_000

export function rowsToMenuData(rows) {
    if (!Array.isArray(rows)) return {}

    const menu = {}
    rows.forEach((row) => {
        const category = (row.categoria || 'Otros').trim()
        ;(menu[category] = menu[category] || []).push({
            id: row.id,
            name: row.nombre,
            time: row.tiempo,
            price: Number(row.precio) || 0,
            isFav: Boolean(row.favorito),
            desc: row.descripcion,
            img: row.imagen,
        })
    })
    return menu
}

export function useMenuData() {
    const [menuData, setMenuData] = useState(fallbackData)
    const [loading, setLoading] = useState(CONFIGURED)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!CONFIGURED) {
            console.warn('Supabase no configurado; se usa el menú de respaldo.')
            return
        }

        let alive = true
        let current
        let lastJson = ''

        const load = async () => {
            current?.abort()
            current = new AbortController()
            try {
                const res = await axios.get(`${SUPABASE_URL}/rest/v1/${SUPABASE_MENU_TABLE}`, {
                    params: {
                        select: 'id,nombre,tiempo,precio,favorito,descripcion,imagen,categoria',
                        disponible: 'eq.true',
                        order: 'id.asc',
                    },
                    headers: { apikey: SUPABASE_ANON_KEY },
                    signal: current.signal,
                })
                if (!alive) return
                const parsed = rowsToMenuData(res.data)
                const json = JSON.stringify(parsed)
                if (json !== lastJson) {
                    lastJson = json
                    setMenuData(parsed)
                }
                setError(null)
            } catch (err) {
                if (axios.isCancel(err) || !alive) return
                setError('No se pudo actualizar el menú.')
            } finally {
                if (alive && !current.signal.aborted) setLoading(false)
            }
        }

        load()
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') load()
        }, REFRESH_MS)
        const onVisible = () => {
            if (document.visibilityState === 'visible') load()
        }
        document.addEventListener('visibilitychange', onVisible)

        return () => {
            alive = false
            clearInterval(id)
            document.removeEventListener('visibilitychange', onVisible)
            current?.abort()
        }
    }, [])

    return { menuData, loading, error }
}