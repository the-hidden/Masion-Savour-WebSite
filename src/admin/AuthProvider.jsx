import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { EMPLOYEE_ROLE, USERNAME_EMAIL_DOMAIN } from './adminConfig'

function toEmail(usuario) {
    const value = usuario.trim().toLowerCase()
    return value.includes('@') ? value : `${value}@${USERNAME_EMAIL_DOMAIN}`
}

function translateAuthError(error, usuario) {
    const code = error.code || ''
    const message = (error.message || '').toLowerCase()

    if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
        return usuario.includes('@')
            ? 'Correo o contraseña incorrectos.'
            : 'Usuario o contraseña incorrectos. Si tu cuenta se creó con otro correo, escribe el correo completo.'
    }
    if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
        return 'Tu cuenta aún no está confirmada. Pídele al administrador que la confirme.'
    }
    if (error.status === 429 || code === 'over_request_rate_limit') {
        return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    }
    if (message.includes('failed to fetch') || message.includes('network')) {
        return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
    }
    return 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

export default function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(isSupabaseConfigured)

    useEffect(() => {
        if (!supabase) return

        let active = true

        supabase.auth.getSession()
            .then(({ data }) => {
                if (!active) return
                setSession(data.session)
            })
            .catch(() => {
                if (active) setSession(null)
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
        })

        return () => {
            active = false
            listener.subscription.unsubscribe()
        }
    }, [])

    const value = useMemo(() => {
        const user = session?.user ?? null

        return {
            session,
            user,
            loading,
            isEmployee: user?.app_metadata?.role === EMPLOYEE_ROLE,

            async signIn(usuario, password) {
                const email = toEmail(usuario)
                try {
                    const { error } = await supabase.auth.signInWithPassword({ email, password })
                    if (error && import.meta.env.DEV) {
                        console.error('[Supabase Auth] Error al iniciar sesión:', {
                            code: error.code,
                            status: error.status,
                            message: error.message,
                            email,
                        })
                    }
                    return { error: error ? translateAuthError(error, usuario) : null }
                } catch {
                    return { error: 'No hay conexión con el servidor. Inténtalo de nuevo.' }
                }
            },
            async signOut() {
                if (supabase) await supabase.auth.signOut()
            },
        }
    }, [session, loading])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
