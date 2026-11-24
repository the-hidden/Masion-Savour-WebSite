import { useEffect, useState } from 'react'
import axios from 'axios'
import { menuData as fallbackData } from '../data/mockData'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_MENU_TABLE } from '../Config'

const REFRESH_MS = 10000

function rowsToMenuData(rows) {
    const menu = {}
    rows.forEach((row) => {
        const category = row.categoria || 'Otros'
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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('Supabase no está configurado (faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Se usa el menú de respaldo.')
            setLoading(false)
            return
        }

        let controller = new AbortController()
        let lastJson = ''

        const fetchMenu = () => {
            controller.abort()
            controller = new AbortController()
            const current = controller

            axios
                .get(`${SUPABASE_URL}/rest/v1/${SUPABASE_MENU_TABLE}`, {
                    params: {
                        select: '*',
                        disponible: 'eq.true',
                        order: 'id.asc',
                    },
                    headers: {
                        apikey: SUPABASE_ANON_KEY,
                        ...(SUPABASE_ANON_KEY.startsWith('eyJ') && {
                            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                        }),
                    },
                    signal: current.signal,
                })
                .then((res) => {
                    const parsed = rowsToMenuData(res.data)
                    if (Object.keys(parsed).length === 0) return
                    const json = JSON.stringify(parsed)
                    if (json !== lastJson) {
                        lastJson = json
                        setMenuData(parsed)
                    }
                })
                .catch((err) => {
                    if (axios.isCancel(err)) return
                    console.warn('No se pudo cargar el menú desde Supabase, se usa el respaldo:', err.message)
                })
                .finally(() => {
                    if (!current.signal.aborted) setLoading(false)
                })
        }

        fetchMenu()

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') fetchMenu()
        }, REFRESH_MS)

        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchMenu()
        }
        document.addEventListener('visibilitychange', onVisible)

        return () => {
            clearInterval(interval)
            document.removeEventListener('visibilitychange', onVisible)
            controller.abort()
        }
    }, [])

    return { menuData, loading }
}