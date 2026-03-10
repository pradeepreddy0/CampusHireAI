// ============================================================
// StudentDashboard.jsx — Premium Student Home with milestone steps
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StatCard from '../components/StatCard'
import ScrollReveal from '../components/ScrollReveal'
import { SkeletonDashboard } from '../components/SkeletonLoader'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } },
}

// AI score bar component
function AIScoreBar({ score }) {
    if (!score) return '—'
    const pct = (score * 100).toFixed(1)
    return (
        <span className="flex items-center gap-2">
            <span className="text-body">{pct}%</span>
            <span className="h-1.5 w-16 rounded-full overflow-hidden bg-white/5">
                <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
            </span>
        </span>
    )
}

// Milestone step item
function MilestoneStep({ label, done, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07, duration: 0.3 }}
            className="milestone-step"
        >
            <div className={`milestone-dot ${done ? 'done' : 'pending'}`}>
                {done ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
            </div>
            <span className={`text-sm font-medium ${done ? 'text-heading' : 'text-sub'}`}>{label}</span>
            {done && (
                <span className="ml-auto text-xs text-emerald-400 font-semibold">✓ Done</span>
            )}
        </motion.div>
    )
}

// App table columns
const appColumns = [
    { key: 'company', label: 'Company', sortable: true, render: (v) => <span className="font-semibold text-heading">{v || '—'}</span> },
    { key: 'role', label: 'Role', render: (v) => <span className="text-body">{v || '—'}</span> },
    {
        key: 'ai_score', label: 'AI Score', sortable: true,
        render: (v) => <AIScoreBar score={v} />,
    },
    {
        key: 'status', label: 'Status',
        render: (v) => v ? <Badge variant={v.toLowerCase()}>{v}</Badge> : '—',
    },
    {
        key: 'applied_at', label: 'Applied', sortable: true,
        render: (v) => v ? <span className="text-sub">{new Date(v).toLocaleDateString()}</span> : '—',
    },
]

function StudentDashboard() {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [resume, setResume] = useState(null)
    const [applications, setApplications] = useState([])
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, resumeRes, appsRes, offersRes] = await Promise.all([
                    api.get('/me'),
                    api.get('/resume/my').catch(() => ({ data: null })),
                    api.get('/applications/my').catch(() => ({ data: [] })),
                    api.get('/offers/my').catch(() => ({ data: [] })),
                ])
                setProfile(profileRes.data)
                setResume(resumeRes.data?.extracted_skills ? resumeRes.data : null)
                setApplications(appsRes.data || [])
                setOffers(offersRes.data || [])
            } catch (err) { console.error('Dashboard load error:', err) }
            finally { setLoading(false) }
        }
        fetchData()
    }, [])

    if (loading) {
        return <div className="max-w-7xl mx-auto"><SkeletonDashboard /></div>
    }

    const stats = [
        { label: 'Applications', value: applications.length, color: 'indigo', icon: '📝', delay: 0 },
        { label: 'Shortlisted', value: applications.filter((a) => a.status === 'Shortlisted').length, color: 'teal', icon: '✅', delay: 0.08 },
        { label: 'Offers', value: offers.length, color: 'violet', icon: '🎁', delay: 0.16 },
        { label: 'Placed', value: applications.filter((a) => a.status === 'Placed').length, color: 'rose', icon: '🏆', delay: 0.24 },
    ]

    const quickLinks = [
        { to: '/drives', icon: '🏢', label: 'Browse Drives', desc: 'Find & apply to placement drives', color: 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/20 hover:border-indigo-400/40' },
        { to: '/training', icon: '📚', label: 'Training Resources', desc: 'Videos, blogs & courses', color: 'from-teal-500/10 to-teal-600/10 border-teal-500/20 hover:border-teal-400/40' },
        { to: '/experiences', icon: '💡', label: 'Interview Prep', desc: 'Previous year experiences', color: 'from-violet-500/10 to-violet-600/10 border-violet-500/20 hover:border-violet-400/40' },
        { to: '/resume/upload', icon: '📄', label: 'Update Resume', desc: 'Manage your resumes', color: 'from-rose-500/10 to-rose-600/10 border-rose-500/20 hover:border-rose-400/40' },
    ]

    const milestones = [
        { label: 'Complete your profile', done: !!profile?.branch },
        { label: 'Upload your resume', done: !!resume },
        { label: 'Apply to a drive', done: applications.length > 0 },
        { label: 'Get shortlisted', done: applications.some((a) => a.status === 'Shortlisted') },
    ]
    const completionPct = Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100)

    // Map apps to table rows
    const appRows = applications.map((app) => ({
        id: app.id,
        company: app.drives?.company_name,
        role: app.drives?.role,
        ai_score: app.ai_score,
        status: app.status,
        applied_at: app.applied_at,
    }))

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* ── Hero Header ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="page-header-gradient"
            >
                <div className="absolute top-0 right-0 w-56 h-56 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)', transform: 'translate(25%, -25%)' }} />
                <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', transform: 'translateY(40%)' }} />

                <div className="relative flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/25">
                            STUDENT PORTAL
                        </span>
                        <h1 className="text-3xl font-black text-white mt-2">
                            Welcome, {profile?.name?.split(' ')[0] || user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-blue-200/70 mt-1 text-sm">
                            {profile?.branch || 'Student'} &nbsp;•&nbsp; CGPA: {profile?.cgpa || '—'}
                        </p>
                        {/* Complete Profile CTA — shown when profile is incomplete */}
                        {(!profile?.branch || !profile?.cgpa) && (
                            <Link
                                to="/profile"
                                className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-amber-200 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                            >
                                ⚡ Complete your profile →
                            </Link>
                        )}
                    </div>

                    {/* Profile Progress Ring — click to edit profile */}
                    <Link to="/me" className="bg-white/5 border border-white/10 hover:border-white/25 rounded-2xl px-5 py-3 flex items-center gap-4 transition-all hover:bg-white/[0.08]" title="View & edit your profile">
                        {/* SVG Ring */}
                        <svg width="52" height="52" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                            <motion.circle
                                cx="26" cy="26" r="21"
                                fill="none"
                                stroke="url(#dashGrad)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 21}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 21 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 21 * (1 - completionPct / 100) }}
                                transition={{ delay: 0.5, duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                            />
                            <defs>
                                <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                            <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
                                {completionPct}%
                            </text>
                        </svg>
                        <div>
                            <p className="text-xs text-blue-200/60 font-semibold uppercase tracking-widest">Profile</p>
                            <p className="text-sm font-bold text-white">Completion</p>
                        </div>
                    </Link>
                </div>
            </motion.div>

            {/* ── Stats Grid ──────────────────────────────────────── */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
                {stats.map((s, i) => (
                    <motion.div key={i} variants={item}>
                        <StatCard {...s} />
                    </motion.div>
                ))}
            </motion.div>

            {/* ── 3-Column Cards ──────────────────────────────────── */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Resume Status */}
                <motion.div variants={item} className="card">
                    <h2 className="section-title text-heading">📄 Resume Status</h2>
                    {resume ? (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-semibold text-emerald-400">Resume Active</span>
                            </div>
                            <p className="text-xs text-sub mb-3">{resume.extracted_skills?.length || 0} skills extracted</p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {resume.extracted_skills?.slice(0, 8).map((s, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                                        style={{
                                            background: `hsla(${(i * 37) % 360}, 70%, 60%, 0.12)`,
                                            color: `hsl(${(i * 37) % 360}, 70%, 65%)`,
                                            border: `1px solid hsla(${(i * 37) % 360}, 70%, 60%, 0.25)`,
                                        }}
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <Link
                                to="/resume/upload"
                                className="inline-flex items-center gap-1.5 text-primary-400 hover:text-primary-300 text-sm font-semibold transition-colors group"
                            >
                                Update resume
                                <span className="transition-transform group-hover:translate-x-1">→</span>
                            </Link>
                        </>
                    ) : (
                        <EmptyState
                            variant="generic"
                            title="No resume uploaded"
                            description="Upload your resume to get AI-powered skill matching."
                            size="sm"
                            action={<Link to="/resume/upload" className="btn-primary text-sm">Upload Resume</Link>}
                        />
                    )}
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={item} className="card">
                    <h2 className="section-title text-heading">⚡ Quick Actions</h2>
                    <div className="space-y-2.5">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br border transition-all duration-200 hover:translate-x-1 group ${link.color}`}
                            >
                                <span className="text-xl transition-transform duration-200 group-hover:scale-110">{link.icon}</span>
                                <div>
                                    <p className="font-semibold text-heading text-sm">{link.label}</p>
                                    <p className="text-xs text-sub">{link.desc}</p>
                                </div>
                                <span className="ml-auto text-sub opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Journey Milestones */}
                <motion.div variants={item} className="card">
                    <h2 className="section-title text-heading">🗺️ Your Journey</h2>
                    <div className="space-y-1">
                        {milestones.map((m, i) => (
                            <MilestoneStep key={i} {...m} index={i} />
                        ))}
                    </div>

                    {/* Offers section below milestones */}
                    {offers.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-white/5">
                            <p className="text-xs text-sub font-semibold uppercase tracking-widest mb-3">🎉 Your Offers</p>
                            <div className="space-y-2">
                                {offers.slice(0, 2).map((offer, i) => (
                                    <motion.div
                                        key={offer.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 + 0.3 }}
                                        className="p-3 rounded-xl relative overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
                                            border: '1px solid rgba(16,185,129,0.15)',
                                        }}
                                    >
                                        <p className="font-bold text-heading text-sm">{offer.company}</p>
                                        <p className="text-xl font-black text-emerald-400">{offer.package} LPA</p>
                                        <p className="text-xs text-sub mt-0.5">{offer.offer_date || 'Date pending'}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* ── Application History Table ───────────────────────── */}
            <ScrollReveal type="up" delay={200}>
                <div className="card">
                    <h2 className="section-title text-heading mb-5">📋 Application History</h2>
                    <DataTable
                        columns={appColumns}
                        data={appRows}
                        emptyVariant="applications"
                        emptyTitle="No applications yet"
                        emptyDesc="Browse drives and apply to get started!"
                        emptyAction={
                            <Link to="/drives">
                                <Button variant="primary" size="sm">Browse Drives</Button>
                            </Link>
                        }
                    />
                </div>
            </ScrollReveal>
        </div>
    )
}

export default StudentDashboard
