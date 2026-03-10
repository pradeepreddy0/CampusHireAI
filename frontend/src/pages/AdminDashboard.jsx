// ============================================================
// AdminDashboard.jsx — Premium Admin Analytics with animations
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import ChartCard from '../components/ChartCard'
import AnimatedCounter from '../components/AnimatedCounter'
import StatCard from '../components/StatCard'
import ProgressRing from '../components/ProgressRing'
import ScrollReveal from '../components/ScrollReveal'
import { SkeletonDashboard } from '../components/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } },
}

// Ticker item for scrolling stats bar
function TickerItem({ icon, label, value, color }) {
    return (
        <span className="inline-flex items-center gap-2 px-6 whitespace-nowrap">
            <span className="text-base">{icon}</span>
            <span className="text-xs font-semibold text-sub uppercase tracking-widest">{label}</span>
            <span className={`text-sm font-black ${color}`}>{value}</span>
            <span className="text-sub/30 ml-4">|</span>
        </span>
    )
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
        return <div className="max-w-7xl mx-auto"><SkeletonDashboard /></div>
    }

    // No analytics at all
    if (!analytics) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="card">
                    <EmptyState
                        variant="generic"
                        title="No analytics data yet"
                        description="Analytics will appear once students start registering and applying."
                        action={<Link to="/admin/drives"><Button variant="primary">Go to Drives</Button></Link>}
                    />
                </div>
            </div>
        )
    }

    const textColor = theme === 'dark' ? '#94a3b8' : '#64748b'
    const gridColor = theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(100,116,139,0.12)'

    const yearStats = analytics?.year_wise_stats || {}
    const years = Object.keys(yearStats).filter((y) => y !== 'Unknown').sort()

    const branchData = analytics ? {
        labels: Object.keys(analytics.branch_stats),
        datasets: [{
            data: Object.values(analytics.branch_stats),
            backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
            borderWidth: 0,
            hoverOffset: 8,
        }],
    } : null

    const skillData = analytics ? {
        labels: Object.keys(analytics.skill_distribution).slice(0, 8),
        datasets: [{
            label: 'Students',
            data: Object.values(analytics.skill_distribution).slice(0, 8),
            backgroundColor: [
                'rgba(59,130,246,0.7)', 'rgba(139,92,246,0.7)', 'rgba(6,182,212,0.7)',
                'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)',
                'rgba(99,102,241,0.7)', 'rgba(244,63,94,0.7)',
            ],
            borderRadius: 8,
            borderWidth: 0,
        }],
    } : null

    const yearChartData = years.length > 0 ? {
        labels: years,
        datasets: [
            {
                label: 'Companies Visited',
                data: years.map((y) => yearStats[y]?.drives || 0),
                backgroundColor: 'rgba(59,130,246,0.7)',
                borderColor: '#3b82f6',
                borderWidth: 0,
                borderRadius: 6,
            },
            {
                label: 'Offers Made',
                data: years.map((y) => yearStats[y]?.offers || 0),
                backgroundColor: 'rgba(139,92,246,0.7)',
                borderColor: '#8b5cf6',
                borderWidth: 0,
                borderRadius: 6,
            },
            {
                label: 'Students Placed',
                data: years.map((y) => yearStats[y]?.placed || 0),
                backgroundColor: 'rgba(16,185,129,0.7)',
                borderColor: '#10b981',
                borderWidth: 0,
                borderRadius: 6,
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

    const tickerItems = [
        { icon: '🎓', label: 'Students', value: stats.students, color: 'text-blue-400' },
        { icon: '🏢', label: 'Drives', value: stats.drives, color: 'text-emerald-400' },
        { icon: '🎁', label: 'Offers', value: stats.offers, color: 'text-purple-400' },
        { icon: '📈', label: 'Placement Rate', value: `${stats.rate}%`, color: 'text-amber-400' },
    ]

    const statCards = [
        { label: 'Total Students', value: stats.students, color: 'indigo', icon: '🎓', delay: 0, subtitle: 'Registered on platform' },
        { label: 'Active Drives', value: stats.drives, color: 'teal', icon: '🏢', delay: 0.08, subtitle: 'Click to view history', to: '/admin/drive-history' },
        { label: 'Offers Made', value: stats.offers, color: 'violet', icon: '🎁', delay: 0.16, subtitle: 'Click to view all', to: '/admin/offers' },
        { label: 'Placement Rate', value: stats.rate, suffix: '%', color: 'rose', icon: '📊', delay: 0.24, subtitle: 'Overall success rate' },
    ]

    const quickActions = [
        { to: '/admin/drives', icon: '🏢', label: 'Manage Drives', color: 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20' },
        { to: '/admin/drive-history', icon: '📋', label: 'Drive History', color: 'from-teal-500/10 to-teal-600/10 border-teal-500/20' },
        { to: '/admin/offers', icon: '🎁', label: 'Offers', color: 'from-violet-500/10 to-violet-600/10 border-violet-500/20' },
        { to: '/admin/training', icon: '📚', label: 'Training', color: 'from-cyan-700/10 to-cyan-800/10 border-cyan-700/20' },
        { to: '/admin/experiences', icon: '💡', label: 'Experiences', color: 'from-rose-500/10 to-rose-600/10 border-rose-500/20' },
        { to: '/reviews', icon: '⭐', label: 'Reviews', color: 'from-fuchsia-500/10 to-fuchsia-600/10 border-fuchsia-500/20' },
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* ── Page Header ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="page-header-gradient"
            >
                {/* Decorative gradient circles */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-24 w-40 h-40 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', transform: 'translateY(40%)' }} />

                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-0.5 rounded-full text-xs font-bold text-blue-300 bg-blue-500/15 border border-blue-500/25">
                                ADMIN PORTAL
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-white">📊 Admin Dashboard</h1>
                        <p className="text-blue-200/70 mt-1 text-sm">Platform Overview &amp; Analytics</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-xs text-blue-200/60 font-medium">Academic Year:</label>
                        <select
                            className="input !w-auto text-sm !bg-white/10 !border-white/15 !text-white"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="all" className="bg-slate-800">All Years</option>
                            {years.map((y) => (
                                <option key={y} value={y} className="bg-slate-800">{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* ── Scrolling Stats Ticker ───────────────────────────── */}
            <ScrollReveal type="up" delay={100}>
                <div className="card !p-3 overflow-hidden">
                    <div className="ticker-wrap">
                        <div className="ticker-track">
                            {[...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
                                <TickerItem key={i} {...t} />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            {/* ── Stat Cards Grid ─────────────────────────────────── */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
                {statCards.map((s, i) => {
                    const card = (
                        <motion.div key={i} variants={item}>
                            <StatCard
                                label={s.label}
                                value={s.value}
                                suffix={s.suffix || ''}
                                icon={s.icon}
                                color={s.color}
                                delay={s.delay}
                                subtitle={s.subtitle}
                            />
                        </motion.div>
                    )
                    return s.to
                        ? <Link key={`link-${i}`} to={s.to} className="block">{card}</Link>
                        : card
                })}
            </motion.div>

            {/* ── Progress Rings Row ──────────────────────────────── */}
            {Object.keys(analytics?.branch_stats || {}).length > 0 && (
                <ScrollReveal type="up" delay={200}>
                    <div className="card">
                        <h2 className="section-title text-heading mb-6">
                            <span>🎯</span> Branch-wise Placement Rates
                        </h2>
                        <div className="flex flex-wrap gap-6 justify-around">
                            {Object.entries(analytics.branch_stats || {}).slice(0, 6).map(([branch, count], i) => (
                                <ProgressRing
                                    key={branch}
                                    value={count}
                                    max={Math.max(...Object.values(analytics.branch_stats))}
                                    size={84}
                                    stroke={7}
                                    color={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 6]}
                                    label={branch.slice(0, 8)}
                                    sublabel={`${count} students`}
                                    delay={i * 150}
                                />
                            ))}
                        </div>
                    </div>
                </ScrollReveal>
            )}

            {/* ── Year-wise Bar Chart ─────────────────────────────── */}
            {yearChartData && (
                <ScrollReveal type="up" delay={300}>
                    <ChartCard
                        title="📅 Year-wise: Companies Visited vs Offers vs Placements"
                        type="bar"
                        data={yearChartData}
                        options={{
                            plugins: { legend: { labels: { color: textColor, font: { size: 12 } } } },
                            scales: {
                                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                                y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true },
                            },
                            borderRadius: 6,
                        }}
                    />
                </ScrollReveal>
            )}

            {/* ── Branch + Skills Charts ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branchData && (
                    <ScrollReveal type="left" delay={100}>
                        <ChartCard
                            title="🌐 Branch Distribution"
                            type="doughnut"
                            data={branchData}
                            options={{ plugins: { legend: { labels: { color: textColor } } }, cutout: '65%' }}
                        />
                    </ScrollReveal>
                )}
                {skillData && (
                    <ScrollReveal type="right" delay={100}>
                        <ChartCard
                            title="🛠️ Top Skills"
                            type="bar"
                            data={skillData}
                            options={{
                                indexAxis: 'y',
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                                    y: { ticks: { color: textColor }, grid: { display: false } },
                                },
                            }}
                        />
                    </ScrollReveal>
                )}
            </div>

            {/* ── Quick Actions Grid ─────────────────────────────── */}
            <ScrollReveal type="up" delay={150}>
                <div className="card">
                    <h2 className="section-title text-heading mb-5">
                        <span>⚡</span> Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {quickActions.map((action, i) => (
                            <motion.div
                                key={action.to}
                                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                            >
                                <Link
                                    to={action.to}
                                    className={`quick-action-card bg-gradient-to-br border ${action.color} group block`}
                                >
                                    <p className="text-2xl mb-2 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
                                        {action.icon}
                                    </p>
                                    <p className="font-semibold text-heading text-xs">{action.label}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </ScrollReveal>
        </div>
    )
}

export default AdminDashboard
