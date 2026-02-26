// ============================================================
// Sidebar.jsx — Collapsible left sidebar with role-based navigation
// ============================================================

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

// SVG Icons as components for clean sidebar links
const icons = {
    dashboard: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    drives: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    resume: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    training: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    prep: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    ),
    reviews: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    ),
    collapse: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
    ),
    expand: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
    ),
}

function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
    const { user, isAdmin } = useAuth()
    const location = useLocation()

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

    const studentLinks = [
        { path: '/student/dashboard', icon: icons.dashboard, label: 'Dashboard' },
        { path: '/drives', icon: icons.drives, label: 'Drives' },
        { path: '/resume/upload', icon: icons.resume, label: 'Resume' },
        { path: '/training', icon: icons.training, label: 'Training' },
        { path: '/experiences', icon: icons.prep, label: 'Interview Prep' },
        { path: '/reviews', icon: icons.reviews, label: 'Reviews' },
    ]

    const adminLinks = [
        { path: '/admin/dashboard', icon: icons.dashboard, label: 'Dashboard' },
        { path: '/admin/drives', icon: icons.drives, label: 'Manage Drives' },
        { path: '/admin/training', icon: icons.training, label: 'Training' },
        { path: '/admin/experiences', icon: icons.prep, label: 'Experiences' },
        { path: '/reviews', icon: icons.reviews, label: 'Reviews' },
    ]

    const links = isAdmin ? adminLinks : studentLinks

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center px-4 h-16 flex-shrink-0 border-b border-current/5 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                    <span className="text-white font-bold text-sm">CH</span>
                </div>
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-heading whitespace-nowrap"
                    >
                        Campus<span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">HireAI</span>
                    </motion.span>
                )}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {links.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`sidebar-link ${isActive(link.path) ? 'active' : ''} ${isCollapsed ? 'justify-center !px-2' : ''}`}
                        title={isCollapsed ? link.label : undefined}
                    >
                        <span className="flex-shrink-0">{link.icon}</span>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="whitespace-nowrap"
                            >
                                {link.label}
                            </motion.span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* User Info + Collapse Toggle */}
            <div className="border-t border-current/5 p-3 flex-shrink-0">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 px-3 py-2 mb-2"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-400 font-medium text-sm">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-heading truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-sub capitalize">{user?.role}</p>
                        </div>
                    </motion.div>
                )}

                {/* Collapse toggle — desktop only */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex w-full sidebar-link justify-center"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? icons.expand : icons.collapse}
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-30 transition-all duration-300 ease-in-out border-r ${isCollapsed ? 'w-[72px]' : 'w-[260px]'
                    }`}
                style={{
                    background: 'inherit',
                }}
            >
                <div className="h-full flex flex-col" style={{ background: 'var(--sidebar-bg, inherit)' }}>
                    {sidebarContent}
                </div>
            </aside>

            {/* Mobile Overlay Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                            className="fixed left-0 top-0 h-screen w-[260px] z-50 md:hidden border-r"
                            style={{ background: 'inherit' }}
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default Sidebar
