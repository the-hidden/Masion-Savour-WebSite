import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { isSupabaseConfigured } from './supabaseClient'
import { USERNAME_EMAIL_DOMAIN } from './adminConfig'

const inputClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 ' +
    'placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

export default function LoginPage() {
    const { session, loading, signIn } = useAuth()
    const location = useLocation()

    const [usuario, setUsuario] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!loading && session) {
        return <Navigate to={location.state?.from || '/admin'} replace />
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!usuario.trim() || !password) {
            setError('Escribe tu usuario y tu contraseña.')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const { error: authError } = await signIn(usuario, password)
            if (authError) setError(authError)
        } catch {
            setError('No se pudo iniciar sesión. Inténtalo de nuevo.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#16181a] px-4 py-10">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
                <h1 className="text-2xl font-bold text-neutral-900">Mansion Savour</h1>
                <p className="mb-6 mt-1 text-sm text-neutral-500">Acceso para empleados</p>

                {!isSupabaseConfigured && (
                    <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        Falta configurar Supabase: revisa <code>VITE_SUPABASE_URL</code> y{' '}
                        <code>VITE_SUPABASE_ANON_KEY</code> en tu archivo <code>.env</code> y reinicia el servidor.
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="usuario" className="mb-1 block text-sm font-medium text-neutral-700">
                            Usuario o correo
                        </label>
                        <input
                            id="usuario"
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            autoFocus
                            className={inputClass}
                            placeholder="Usuario o Usuario@gmail.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                className={`${inputClass} pr-16`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-pressed={showPassword}
                                className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-800"
                            >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-[#fe741f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? 'Entrando…' : 'Iniciar sesión'}
                    </button>
                </form>

                <Link to="/" className="mt-6 block text-center text-sm text-neutral-500 hover:text-neutral-800">
                    ← Volver al sitio
                </Link>
            </div>
        </div>
    )
}
