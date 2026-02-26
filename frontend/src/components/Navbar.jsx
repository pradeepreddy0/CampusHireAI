// ============================================================
// Navbar.jsx — Top utility bar with search, notifications, profile
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationPanel from './NotificationPanel'

function Navbar({ onHamburgerClick }) {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { unreadCount } = useNotifications()
    const navigate = useNavigate()

    const [showNotifications, setShowNotifications] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const profileRef = useRef(null)
    const notifRef = useRef(null)

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="sticky top-0 z-20 backdrop-blur-xl border-b border-current/5" style={{ background: 'inherit' }}>
            <div className="flex items-center h-16 px-4 sm:px-6">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onHamburgerClick}
                    className="md:hidden p-2 rounded-xl hover:bg-primary-500/10 transition-colors mr-3"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search drives, resources..."
                            className="input !pl-10 !py-2 text-sm !rounded-xl !bg-opacity-50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3 ml-auto">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl transition-all duration-200 hover:bg-primary-500/10"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        <motion.span
                            key={theme}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="block text-lg"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </motion.span>
                    </button>

                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
                            className="p-2 rounded-xl transition-all duration-200 hover:bg-primary-500/10 relative"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse-badge">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <NotificationPanel
                            isOpen={showNotifications}
                            onClose={() => setShowNotifications(false)}
                        />
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
                            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-primary-500/10 transition-all duration-200"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-full flex items-center justify-center">
                                <span className="text-primary-400 font-medium text-sm">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <span className="hidden sm:block text-sm font-medium text-heading">
                                {user?.name?.split(' ')[0] || 'User'}
                            </span>
                            <svg className={`w-4 h-4 text-sub transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-56 card !p-2 z-50"
                                >
                                    <div className="px-3 py-2 border-b border-current/10 mb-1">
                                        <p className="text-sm font-medium text-heading">{user?.name || 'User'}</p>
                                        <p className="text-xs text-sub">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
