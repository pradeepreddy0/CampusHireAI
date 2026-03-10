// ============================================================
// Navbar.jsx — Premium fixed top bar with gradient search
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../context/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationPanel from './NotificationPanel'

function Navbar({ onHamburgerClick, sidebarWidth = 260 }) {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { unreadCount } = useNotifications()
    const navigate = useNavigate()

    const [showNotifications, setShowNotifications] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    const profileRef = useRef(null)
    const notifRef = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Track viewport for mobile/desktop left offset
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || 'U'
    const displayName = user?.name?.split(' ')[0] || 'User'

    // Navbar sits to the right of the sidebar on desktop, full-width on mobile
    const leftOffset = isMobile ? 0 : sidebarWidth

    return (
        <nav
            className="fixed top-0 right-0 z-20"
            style={{
                left: leftOffset,
                background: theme === 'dark'
                    ? 'rgba(6, 11, 24, 0.92)'
                    : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(99,102,241,0.12)',
                boxShadow: theme === 'dark'
                    ? '0 1px 20px rgba(0,0,0,0.3)'
                    : '0 1px 12px rgba(99,102,241,0.08)',
                transition: 'left 0.3s ease',
            }}
        >
            <div className="flex items-center h-16 px-4 sm:px-6 gap-3">

                {/* ── Hamburger (mobile) ─────────────────────────── */}
                <button
                    onClick={onHamburgerClick}
                    className="md:hidden p-2 rounded-xl hover:bg-primary-500/10 transition-colors flex-shrink-0"
                >
                    <svg className="w-5 h-5 text-body" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* ── Search Bar ─────────────────────────────────── */}
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <motion.svg
                            animate={{ color: searchFocused ? '#3b82f6' : (theme === 'dark' ? '#64748b' : '#94a3b8') }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </motion.svg>

                        <input
                            type="text"
                            placeholder="Search drives, resources..."
                            className="input !pl-10 !py-2 text-sm !rounded-xl w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />

                        {searchFocused && (
                            <div
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{ boxShadow: '0 0 0 2px rgba(59,130,246,0.3), 0 0 16px rgba(59,130,246,0.1)' }}
                            />
                        )}

                        <AnimatePresence>
                            {searchQuery && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.7 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.7 }}
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sub hover:text-heading transition-colors text-xs"
                                >
                                    ✕
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Right Actions ───────────────────────────────── */}
                <div className="flex items-center gap-1 ml-auto">

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl transition-all duration-200 hover:bg-primary-500/10"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        <motion.span
                            key={theme}
                            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                            className="block text-lg select-none"
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
                            <svg className="w-5 h-5 text-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <>
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full opacity-40 animate-ping" />
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </>
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
                            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-primary-500/10 transition-all duration-200 ml-1"
                        >
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                }}
                            >
                                <span className="text-primary-400 font-bold text-sm">{avatarLetter}</span>
                            </div>
                            <span className="hidden sm:block text-sm font-semibold text-heading">{displayName}</span>
                            <motion.svg
                                animate={{ rotate: showProfile ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-3.5 h-3.5 text-sub hidden sm:block"
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </motion.svg>
                        </button>

                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                                    transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                                    className="absolute right-0 top-full mt-2 w-60 card !p-2 z-50"
                                >
                                    <div
                                        className="px-3 py-3 mb-1 rounded-xl"
                                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                                }}
                                            >
                                                <span className="text-white font-bold text-sm">{avatarLetter}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-heading">{user?.name || 'User'}</p>
                                                <p className="text-xs text-sub">{user?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-3 py-1.5 mb-1">
                                        <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
                                            {user?.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}
                                        </span>
                                    </div>

                                    <div className="border-t border-white/5 mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                                            style={{ color: '#f87171' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
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
