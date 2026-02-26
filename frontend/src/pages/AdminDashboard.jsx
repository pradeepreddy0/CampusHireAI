// ============================================================
// AdminDashboard.jsx — Admin Analytics with animations
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import ChartCard from '../components/ChartCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { SkeletonDashboard } from '../components/SkeletonLoader'

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function AdminDashboard() {
    const { theme } = useTheme()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState('all')

    useEffect(() => {
        const fetchAnalytics = async () => {
            try { const res = await api.get('/analytics'); setAnalytics(res.data) }
            catch (err) { console.error('Analytics error:', err) }
            finally { setLoading(false) }
        }
        fetchAnalytics()
    }, [])

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <SkeletonDashboard />
            </div>
        )
    }

    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'
    const gridColor = theme === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.15)'

    const yearStats = analytics?.year_wise_stats || {}
    const years = Object.keys(yearStats).filter((y) => y !== 'Unknown').sort()

    // Branch chart
    const branchData = analytics ? {
        labels: Object.keys(analytics.branch_stats),
        datasets: [{
            data: Object.values(analytics.branch_stats),
            backgroundColor: ['#3b82f6', '#8b5cf6', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
            borderWidth: 0,
        }],
    } : null

    // Skill chart
    const skillData = analytics ? {
        labels: Object.keys(analytics.skill_distribution).slice(0, 8),
        datasets: [{
            label: 'Students',
            data: Object.values(analytics.skill_distribution).slice(0, 8),
            backgroundColor: 'rgba(59,130,246,0.3)',
            borderColor: '#3b82f6',
            borderWidth: 1.5,
        }],
    } : null

    // Year-wise chart
    const yearChartData = years.length > 0 ? {
        labels: years,
        datasets: [
            {
                label: 'Companies Visited',
                data: years.map((y) => yearStats[y]?.drives || 0),
                backgroundColor: 'rgba(59,130,246,0.6)',
                borderColor: '#3b82f6',
                borderWidth: 1,
            },
            {
                label: 'Offers Made',
                data: years.map((y) => yearStats[y]?.offers || 0),
                backgroundColor: 'rgba(139,92,246,0.6)',
                borderColor: '#8b5cf6',
                borderWidth: 1,
            },
            {
                label: 'Students Placed',
                data: years.map((y) => yearStats[y]?.placed || 0),
                backgroundColor: 'rgba(16,185,129,0.6)',
                borderColor: '#10b981',
                borderWidth: 1,
            },
        ],
    } : null

    const getStats = () => {
        if (selectedYear === 'all') return {
            students: analytics?.total_students || 0,
            drives: analytics?.total_drives || 0,
            offers: analytics?.total_offers || 0,
            rate: analytics?.placement_rate || 0,
        }
        const ys = yearStats[selectedYear] || {}
        return {
            students: analytics?.total_students || 0,
            drives: ys.drives || 0,
            offers: ys.offers || 0,
            rate: analytics?.placement_rate || 0,
        }
    }
    const stats = getStats()

    const statCards = [
        { label: 'Students', value: stats.students, gradient: 'from-blue-600 to-blue-500', text: 'text-blue-100' },
        { label: 'Drives', value: stats.drives, gradient: 'from-emerald-600 to-emerald-500', text: 'text-emerald-100' },
        { label: 'Offers', value: stats.offers, gradient: 'from-purple-600 to-purple-500', text: 'text-purple-100' },
        { label: 'Placement Rate', value: stats.rate, suffix: '%', gradient: 'from-amber-600 to-amber-500', text: 'text-amber-100' },
    ]

    return (
        <div className="max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8 flex-wrap gap-4"
            >
                <div>
                    <h1 className="text-2xl text-heading">📊 Admin Dashboard</h1>
                    <p className="text-sub mt-1">Platform Overview & Analytics</p>
                </div>
                <div className="flex items-center space-x-2">
                    <label className="text-sm text-sub font-medium">Academic Year:</label>
                    <select className="input !w-auto text-sm" value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="all">All Years</option>
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
            >
                {statCards.map((s, i) => (
                    <motion.div
                        key={`${selectedYear}-${i}`}
                        variants={item}
                        className={`card-gradient bg-gradient-to-br ${s.gradient}`}
                    >
                        <p className={`${s.text} text-sm`}>{s.label}</p>
                        <p className="text-3xl font-bold mt-1">
                            <AnimatedCounter value={s.value} suffix={s.suffix || ''} />
                        </p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Year-wise Chart */}
            {yearChartData && (
                <div className="mb-8">
                    <ChartCard
                        title="📅 Year-wise: Companies Visited vs Offers vs Placements"
                        type="bar"
                        data={yearChartData}
                        options={{
                            plugins: { legend: { labels: { color: textColor } } },
                            scales: {
                                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                                y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
                            },
                        }}
                    />
                </div>
            )}

            {/* Branch + Skills Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {branchData && (
                    <ChartCard
                        title="Branch Distribution"
                        type="doughnut"
                        data={branchData}
                        options={{ plugins: { legend: { labels: { color: textColor } } } }}
                    />
                )}
                {skillData && (
                    <ChartCard
                        title="Top Skills"
                        type="bar"
                        data={skillData}
                        options={{
                            plugins: { legend: { labels: { color: textColor } } },
                            scales: {
                                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                                y: { ticks: { color: textColor }, grid: { color: gridColor } },
                            },
                        }}
                    />
                )}
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
            >
                <h2 className="text-lg font-semibold text-heading mb-4">⚡ Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { to: '/admin/drives', icon: '🏢', label: 'Manage Drives' },
                        { to: '/admin/training', icon: '📚', label: 'Training' },
                        { to: '/admin/experiences', icon: '💡', label: 'Experiences' },
                        { to: '/reviews', icon: '⭐', label: 'Reviews' },
                    ].map(action => (
                        <Link key={action.to} to={action.to} className="p-4 rounded-xl border border-current/5 hover:bg-primary-500/5 transition-all text-center hover:scale-105 duration-200">
                            <p className="text-2xl mb-1">{action.icon}</p>
                            <p className="font-medium text-heading text-sm">{action.label}</p>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

export default AdminDashboard
