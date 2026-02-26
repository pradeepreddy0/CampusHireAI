// ============================================================
// ProtectedRoute.jsx — Auth Guard with DashboardLayout
// ============================================================

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from './DashboardLayout'

function ProtectedRoute() {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    )
}

export default ProtectedRoute
