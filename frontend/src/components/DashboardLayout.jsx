// ============================================================
// DashboardLayout.jsx — Shell with animated background + particles
// ============================================================

import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useTheme } from '../context/ThemeContext'

// Mini floating particle
function Particle({ style }) {
    return (
        <div
            className="absolute rounded-full pointer-events-none"
            style={{
                width: style.size,
                height: style.size,
                left: style.x,
                top: style.y,
                background: style.color,
                opacity: style.opacity,
                animation: `float ${style.duration}s ease-in-out infinite`,
                animationDelay: `${style.delay}s`,
                filter: 'blur(1px)',
            }}
        />
    )
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    size: `${Math.random() * 4 + 2}px`,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    color: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 5],
    opacity: Math.random() * 0.18 + 0.06,
    duration: Math.random() * 6 + 5,
    delay: Math.random() * -8,
}))

function DashboardLayout({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { theme } = useTheme()

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Ambient background orbs */}
            <div className="orb orb-blue" />
            <div className="orb orb-purple" />
            <div className="orb orb-cyan" />

            {/* Subtle floating particles */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {PARTICLES.map((p, i) => <Particle key={i} style={p} />)}
            </div>

            {/* Sidebar */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            {/* Main content area */}
            <div
                className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'}`}
            >
                {/* Fixed top navbar — offset matches sidebar */}
                <Navbar
                    onHamburgerClick={() => setIsMobileOpen(true)}
                    sidebarWidth={isCollapsed ? 72 : 260}
                />

                {/* Page content — pt-20 clears the fixed navbar with extra breathing room */}
                <main className="pt-20 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 relative z-10">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout
