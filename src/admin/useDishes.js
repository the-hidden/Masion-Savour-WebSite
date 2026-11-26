import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { SUPABASE_MENU_TABLE as TABLE } from '../Config'

const NO_PERMISSION =
    'No tienes permiso para hacer este cambio. Verifica que tu cuenta esté habilitada como empleado y vuelve a iniciar sesión.'

function friendly(error) {
    if (error.code === '42501') return NO_PERMISSION
    return error.message || 'Ocurrió un error inesperado.'
}

export function useDishes() {
    const [dishes, setDishes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        if (!supabase) {
            setError('Supabase no está configurado.')
            setLoading(false)
            return
        }
        let cancelled = false
        supabase.from(TABLE).select('*').order('categoria').order('nombre')
            .then(({ data, error: err }) => {
                if (cancelled) return
                if (err) setError(friendly(err))
                else { setDishes(data); setError('') }
            })
            .catch(() => {
                if (!cancelled) setError('No se pudo cargar el menú.')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [reloadKey])

    const reload = () => {
        setLoading(true)
        setReloadKey((k) => k + 1)
    }

    // CREAR
    const createDish = async (payload) => {
        const { data, error: err } = await supabase.from(TABLE).insert(payload).select().single()
        if (err) throw new Error(friendly(err))
        setDishes((prev) => [...prev, data])
    }

    // ACTUALIZAR
    const updateDish = async (id, changes) => {
        const { data, error: err } = await supabase
            .from(TABLE)
    }

    return { dishes, loading, error, reload, createDish, updateDish, deleteDish }
}
