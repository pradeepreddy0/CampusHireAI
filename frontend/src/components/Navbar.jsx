// ============================================================
// Navbar.jsx — Top Navigation Bar
//
// Displays role-aware navigation links:
//   - Students: Dashboard, Drives, Resume, Training
//   - Admins:   Dashboard, Drives, Analytics
// Includes user name display and logout button.
// ============================================================

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
    const { user, isAdmin, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    // Handle logout
    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    // Check if a link is active
    const isActive = (path) => location.pathname.startsWith(path)

    // Link style helper
    const linkClass = (path) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive(path)
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
        }`

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* ── Logo ───────────────────────────────────── */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">CH</span>
                        </div>
                        <span className="font-bold text-lg text-gray-800">
                            Campus<span className="text-primary-600">HireAI</span>
                        </span>
                    </Link>

                    {/* ── Navigation Links ───────────────────────── */}
                    <div className="hidden md:flex items-center space-x-1">
                        {isAdmin ? (
                            <>
                                {/* Admin links */}
                                <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
                                    📊 Dashboard
                                </Link>
                                <Link to="/admin/drives" className={linkClass('/admin/drives')}>
                                    🏢 Drives
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* Student links */}
                                <Link to="/student/dashboard" className={linkClass('/student/dashboard')}>
                                    🏠 Dashboard
                                </Link>
                                <Link to="/drives" className={linkClass('/drives')}>
                                    🏢 Drives
                                </Link>
                                <Link to="/resume/upload" className={linkClass('/resume')}>
                                    📄 Resume
                                </Link>
                                <Link to="/training" className={linkClass('/training')}>
                                    📚 Training
                                </Link>
                            </>
                        )}
                    </div>

                    {/* ── User Info & Logout ──────────────────────── */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-700 font-medium text-sm">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-700">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Navigation ──────────────────────────── */}
            <div className="md:hidden border-t border-gray-100 px-4 py-2 flex space-x-1 overflow-x-auto">
                {isAdmin ? (
                    <>
                        <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
                            📊 Dashboard
                        </Link>
                        <Link to="/admin/drives" className={linkClass('/admin/drives')}>
                            🏢 Drives
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/student/dashboard" className={linkClass('/student/dashboard')}>
                            🏠 Dashboard
                        </Link>
                        <Link to="/drives" className={linkClass('/drives')}>
                            🏢 Drives
                        </Link>
                        <Link to="/resume/upload" className={linkClass('/resume')}>
                            📄 Resume
                        </Link>
                        <Link to="/training" className={linkClass('/training')}>
                            📚 Training
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}

export default Navbar
