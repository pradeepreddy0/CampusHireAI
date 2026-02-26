// ============================================================
// StudentDashboard.jsx — Student Home with animations
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
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

    const statusBadge = (status) => {
        const map = {
            Applied: 'badge-applied', Shortlisted: 'badge-shortlisted',
            Rejected: 'badge-rejected', Offered: 'badge-offered', Placed: 'badge-placed',
        }
        return map[status] || 'badge-applied'
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <SkeletonDashboard />
            </div>
        )
    }

    const stats = [
        { label: 'Applications', value: applications.length, gradient: 'from-blue-600 to-blue-500', text: 'text-blue-100' },
        { label: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, gradient: 'from-emerald-600 to-emerald-500', text: 'text-emerald-100' },
        { label: 'Offers', value: offers.length, gradient: 'from-purple-600 to-purple-500', text: 'text-purple-100' },
        { label: 'Placed', value: applications.filter(a => a.status === 'Placed').length, gradient: 'from-amber-600 to-amber-500', text: 'text-amber-100' },
    ]

    return (
        <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-2xl text-heading">Welcome, {profile?.name || user?.name}! 👋</h1>
                <p className="text-sub mt-1">{profile?.branch || 'Student'} • CGPA: {profile?.cgpa || '—'}</p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
            >
                {stats.map((s, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className={`card-gradient bg-gradient-to-br ${s.gradient}`}
                    >
                        <p className={`${s.text} text-sm`}>{s.label}</p>
                        <p className="text-3xl font-bold mt-1">
                            <AnimatedCounter value={s.value} />
                        </p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Resume Status */}
                <motion.div variants={item} className="card">
                    <h2 className="text-lg font-semibold text-heading mb-4">📄 Resume</h2>
                    {resume ? (
                        <>
                            <p className="text-sm text-body mb-3">Skills extracted: {resume.extracted_skills?.length || 0}</p>
                            <div className="flex flex-wrap gap-1">
                                {resume.extracted_skills?.slice(0, 10).map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg text-xs">
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <Link to="/resume/upload" className="mt-4 inline-block text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                                Update resume →
                            </Link>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-sub mb-3">No resume uploaded yet</p>
                            <Link to="/resume/upload" className="btn-primary text-sm">Upload Resume</Link>
                        </div>
                    )}
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={item} className="card">
                    <h2 className="text-lg font-semibold text-heading mb-4">⚡ Quick Actions</h2>
                    <div className="space-y-3">
                        <Link to="/drives" className="block p-3 rounded-xl border border-current/5 hover:bg-primary-500/5 transition-all hover:translate-x-1 duration-200">
                            <p className="font-medium text-heading text-sm">🏢 Browse Drives</p>
                            <p className="text-xs text-sub">Find and apply to placement drives</p>
                        </Link>
                        <Link to="/training" className="block p-3 rounded-xl border border-current/5 hover:bg-primary-500/5 transition-all hover:translate-x-1 duration-200">
                            <p className="font-medium text-heading text-sm">📚 Training Resources</p>
                            <p className="text-xs text-sub">Videos, blogs and courses</p>
                        </Link>
                        <Link to="/experiences" className="block p-3 rounded-xl border border-current/5 hover:bg-primary-500/5 transition-all hover:translate-x-1 duration-200">
                            <p className="font-medium text-heading text-sm">💡 Interview Prep</p>
                            <p className="text-xs text-sub">Previous year experiences & tips</p>
                        </Link>
                    </div>
                </motion.div>

                {/* Offers */}
                <motion.div variants={item} className="card">
                    <h2 className="text-lg font-semibold text-heading mb-4">🎉 Offers</h2>
                    {offers.length > 0 ? (
                        <div className="space-y-3">
                            {offers.map((offer) => (
                                <div key={offer.id} className="p-3 rounded-xl border border-current/5">
                                    <p className="font-medium text-heading text-sm">{offer.company}</p>
                                    <p className="text-lg font-bold text-emerald-400">{offer.package} LPA</p>
                                    <p className="text-xs text-sub">{offer.offer_date || 'Date pending'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sub text-center py-6">No offers yet. Keep applying! 💪</p>
                    )}
                </motion.div>
            </motion.div>

            {/* Application History */}
            {applications.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card mt-6"
                >
                    <h2 className="text-lg font-semibold text-heading mb-4">📋 Application History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-current/10">
                                    <th className="text-left py-3 px-2 font-medium text-sub">Company</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Role</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Score</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Status</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} className="border-b border-current/5 hover:bg-primary-500/5 transition-colors">
                                        <td className="py-3 px-2 font-medium text-heading">{app.drives?.company_name || '—'}</td>
                                        <td className="py-3 px-2 text-body">{app.drives?.role || '—'}</td>
                                        <td className="py-3 px-2 text-body">{app.ai_score ? (app.ai_score * 100).toFixed(1) + '%' : '—'}</td>
                                        <td className="py-3 px-2"><span className={statusBadge(app.status)}>{app.status}</span></td>
                                        <td className="py-3 px-2 text-sub">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default StudentDashboard
