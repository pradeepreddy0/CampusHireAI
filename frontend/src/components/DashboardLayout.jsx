// ============================================================
// DashboardLayout.jsx — Shell with sidebar + navbar + content
// ============================================================

import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

function DashboardLayout({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <div className="min-h-screen relative">
            {/* Background orbs */}
            <div className="orb orb-blue"></div>
            <div className="orb orb-purple"></div>

            {/* Sidebar */}
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            {/* Main content area */}
            <div
                className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'
                    }`}
            >
                {/* Top navbar */}
                <Navbar onHamburgerClick={() => setIsMobileOpen(true)} />

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8 relative z-10">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default DashboardLayout
