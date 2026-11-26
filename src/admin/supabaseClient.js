import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../Config'

// Si faltan las variables del .env no se crea el cliente (createClient lanzaría un error
// y rompería la pantalla). El resto del panel avisa con un mensaje claro.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Una sola instancia para todo el panel. Guarda la sesión en el navegador
// y la renueva sola, así que el empleado no tiene que volver a entrar a cada rato.
export const supabase = isSupabaseConfigured
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null
