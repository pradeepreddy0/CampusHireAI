// ============================================================
// DriveHistory.jsx — All drives with per-drive stats
// Admin-only page at /admin/drive-history
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'

const STATUS_STYLES = {
    Upcoming: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    Ongoing: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Closed: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    Unknown: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
}

function DriveHistory() {
    const navigate = useNavigate()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all') // all | Upcoming | Ongoing | Closed

    useEffect(() => {
        api.get('/drives/history')
            .then(r => setDrives(r.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const displayed = drives.filter(d => {
        const matchSearch = (
            d.company_name.toLowerCase().includes(search.toLowerCase()) ||
            d.role.toLowerCase().includes(search.toLowerCase())
        )
        const matchFilter = filter === 'all' || d.status === filter
        return matchSearch && matchFilter
    })

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6 flex-wrap gap-4"
            >
                <div>
                    <h1 className="text-2xl text-heading">📋 Drive History</h1>
                    <p className="text-sub mt-1">All placement drives with applicant stats</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <input
                        className="input !w-48 text-sm"
                        placeholder="Search company / role…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="input !w-36 text-sm"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </motion.div>

            {loading ? (
                <div className="card text-center text-sub py-16">Loading drive history…</div>
            ) : displayed.length === 0 ? (
                <div className="card text-center text-sub py-16">No drives found.</div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card overflow-x-auto p-0"
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-sub">
                                <th className="text-left px-5 py-3 font-medium">Company</th>
                                <th className="text-left px-5 py-3 font-medium">Role</th>
                                <th className="text-left px-5 py-3 font-medium">Status</th>
                                <th className="text-right px-5 py-3 font-medium">Applied</th>
                                <th className="text-right px-5 py-3 font-medium">Shortlisted</th>
                                <th className="text-right px-5 py-3 font-medium">Offered</th>
                                <th className="text-right px-5 py-3 font-medium">Placed</th>
                                <th className="text-right px-5 py-3 font-medium">Package</th>
                                <th className="text-right px-5 py-3 font-medium">Deadline</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((d, i) => (
                                <motion.tr
                                    key={d.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                >
                                    <td className="px-5 py-3 font-semibold text-heading">{d.company_name}</td>
                                    <td className="px-5 py-3 text-sub">{d.role}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[d.status] || STATUS_STYLES.Unknown}`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-blue-400 font-semibold">{d.applied}</td>
                                    <td className="px-5 py-3 text-right text-amber-400 font-semibold">{d.shortlisted}</td>
                                    <td className="px-5 py-3 text-right text-purple-400 font-semibold">{d.offered}</td>
                                    <td className="px-5 py-3 text-right text-emerald-400 font-semibold">{d.placed}</td>
                                    <td className="px-5 py-3 text-right text-sub">
                                        {d.package ? `${d.package} LPA` : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-right text-sub text-xs">
                                        {d.deadline ? new Date(d.deadline).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => navigate(`/admin/drives/${d.id}/workflow`)}
                                            className="btn-secondary text-xs !px-3 !py-1"
                                        >
                                            Workflow →
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    )
}

export default DriveHistory
