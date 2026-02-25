// ============================================================
// AuthContext.jsx — Authentication State Management
//
// Stores JWT token and decoded user info in React Context.
// Provides login(), logout(), and auth state to all components.
// Token is persisted in localStorage so it survives page refresh.
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// ── Helper: decode JWT payload without a library ────────────
function decodeToken(token) {
    try {
        // JWT has 3 parts: header.payload.signature
        const payload = token.split('.')[1]
        // Base64url decode
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decoded)
    } catch {
        return null
    }
}

// ── Auth Provider Component ─────────────────────────────────
export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [user, setUser] = useState(null)

    // When token changes, decode and set user info
    useEffect(() => {
        if (token) {
            const decoded = decodeToken(token)
            if (decoded) {
                setUser({
                    id: decoded.sub,
                    email: decoded.email,
                    role: decoded.role,
                    name: decoded.name,
                })
            }
        } else {
            setUser(null)
        }
    }, [token])

    // ── Login: store token received from API ──────────────────
    const login = (tokenData) => {
        // tokenData comes from the /api/login or /api/signup response
        const accessToken = tokenData.access_token
        localStorage.setItem('token', accessToken)
        localStorage.setItem('role', tokenData.role)
        localStorage.setItem('user_id', tokenData.user_id)
        localStorage.setItem('user_name', tokenData.name)
        setToken(accessToken)
    }

    // ── Logout: clear everything ──────────────────────────────
    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_name')
        setToken(null)
        setUser(null)
    }

    // ── Computed helpers ──────────────────────────────────────
    const isAuthenticated = !!token && !!user
    const isAdmin = user?.role === 'admin'
    const isStudent = user?.role === 'student'

    const value = {
        token,
        user,
        isAuthenticated,
        isAdmin,
        isStudent,
        login,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// ── Custom hook for consuming auth context ──────────────────
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
