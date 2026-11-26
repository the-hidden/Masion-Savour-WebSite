import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

function Screen({ children }) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#16181a] p-6 text-center text-white">
            <div className="max-w-sm">{children}</div>
        </div>
    )
}

export default function ProtectedRoute() {
    const { session, loading, isEmployee, signOut } = useAuth()
    const location = useLocation()

    if (loading) {
        return <Screen><p className="text-neutral-300">Cargando…</p></Screen>
    }

    if (!session) {
        return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    }

    if (!isEmployee) {
        return (
            <Screen>
                <h1 className="mb-2 text-xl font-semibold">Sin permisos</h1>
                <p className="mb-6 text-sm text-neutral-300">
                    Tu cuenta no está habilitada como empleado. Pídele al administrador que la active
                    y vuelve a iniciar sesión.
                </p>
                <button
                    type="button"
                    onClick={signOut}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-[#fe741f]"
                >
                    Cerrar sesión
                </button>
            </Screen>
        )
    }

    return <Outlet />
}
