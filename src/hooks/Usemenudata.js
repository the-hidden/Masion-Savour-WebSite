import { useEffect, useState } from 'react'
import axios from 'axios'
import { menuData as fallbackData } from '../data/mockData'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_MENU_TABLE } from '../Config'

// Convierte las filas de Supabase en { Categoria: [platos] }, que es lo que
// esperan MenuSection y FoodCard.
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

        const controller = new AbortController()

        axios
            .get(`${SUPABASE_URL}/rest/v1/${SUPABASE_MENU_TABLE}`, {
                params: {
                    select: '*',
                    disponible: 'eq.true',
                    order: 'id.asc',
                },
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                },
                signal: controller.signal,
            })
            .then((res) => {
                const parsed = rowsToMenuData(res.data)
                if (Object.keys(parsed).length > 0) setMenuData(parsed)
            })
            .catch((err) => {
                if (axios.isCancel(err)) return
                console.warn('No se pudo cargar el menú desde Supabase, se usa el respaldo:', err.message)
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })

        return () => controller.abort()
    }, [])

    return { menuData, loading }
}