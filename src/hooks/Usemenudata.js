import { useEffect, useState } from 'react'
import axios from 'axios'
import { menuData as fallbackData } from '../data/mockData'
import { MENU_CSV_URL } from '../Config'

function parseCSV(text) {
    const rows = []
    let row = []
    let field = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') {
                field += '"'
                i++
            } else if (c === '"') {
                inQuotes = false
            } else {
                field += c
            }
        } else if (c === '"') {
            inQuotes = true
        } else if (c === ',') {
            row.push(field)
            field = ''
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++
            row.push(field)
            rows.push(row)
            row = []
            field = ''
        } else {
            field += c
        }
    }
    if (field || row.length) {
        row.push(field)
        rows.push(row)
    }
    return rows
}

function rowsToMenuData(rows) {
    const [header, ...data] = rows
    const keys = header.map((h) => h.trim().toLowerCase())

    const menu = {}
    data
        .filter((r) => r.some((cell) => cell.trim() !== ''))
        .map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])))
        .filter((row) => row.disponible?.toLowerCase() !== 'no')
        .forEach((row, index) => {
            const category = row.categoria || 'Otros'
                ; (menu[category] = menu[category] || []).push({
                    id: index + 1,
                    name: row.nombre,
                    time: row.tiempo,
                    price: parseFloat(row.precio) || 0,
                    isFav: row.favorito?.toLowerCase() === 'si',
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
        const controller = new AbortController()

        axios
            .get(MENU_CSV_URL, { responseType: 'text', signal: controller.signal })
            .then((res) => {
                const parsed = rowsToMenuData(parseCSV(res.data))
                if (Object.keys(parsed).length > 0) setMenuData(parsed)
            })
            .catch(() => {
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })

        return () => controller.abort()
    }, [])

    return { menuData, loading }
}