// ============================================================
// ProtectedRoute.jsx — Auth Guard for Routes
//
// Wraps routes that require authentication.
// Redirects to /login if no valid token is present.
// ============================================================

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
    const { isAuthenticated } = useAuth()

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Render the child route
    return <Outlet />
}

export default ProtectedRoute
