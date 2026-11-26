import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './AuthProvider'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from './LoginPage'
import DishesPage from './DishesPage'


export default function AdminApp() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="login" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route index element={<DishesPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </AuthProvider>
    )
}
