// ============================================================
// OffersPage.jsx — All placement offers with filters + export
// Admin-only page at /admin/offers
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

const ALL_BRANCHES = [
    'CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'CHEM', 'MBA', 'MCA', 'Other'
]

// Client-side CSV export — no extra library needed.
// Generates a UTF-8 BOM CSV that Excel opens natively.
function exportToExcel(offers) {
    const rows = [
        ['Student Name', 'Roll No', 'Branch / Dept', 'CGPA', 'Company', 'Package (LPA)', 'Offer Date'],
        ...offers.map(o => {
            const s = o.users || {}
            return [
                s.name || '',
                s.roll_no || '',
                s.branch || '',
                s.cgpa ?? '',
                o.company || '',
                o.package ?? '',
                o.offer_date ? new Date(o.offer_date).toLocaleDateString() : '',
            ]
        })
    ]

    const csv = '\uFEFF' + rows.map(r =>
        r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `offers_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
}

function OffersPage() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [company, setCompany] = useState('')
    const [branch, setBranch] = useState('')
    const [minPkg, setMinPkg] = useState('')
    const [maxPkg, setMaxPkg] = useState('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')

    const fetchOffers = useCallback(() => {
        setLoading(true)
        const params = {}
        if (company) params.company = company
        if (branch) params.branch = branch
        if (minPkg) params.min_package = minPkg
        if (maxPkg) params.max_package = maxPkg
        if (fromDate) params.from_date = fromDate
        if (toDate) params.to_date = toDate

        api.get('/offers/all', { params })
            .then(r => setOffers(r.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [company, branch, minPkg, maxPkg, fromDate, toDate])

    useEffect(() => { fetchOffers() }, [])

    const handleReset = () => {
        setCompany(''); setBranch(''); setMinPkg('')
        setMaxPkg(''); setFromDate(''); setToDate('')
        api.get('/offers/all')
            .then(r => setOffers(r.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }

    const totalPackage = offers.reduce((s, o) => s + (o.package || 0), 0)
    const avgPackage = offers.length ? (totalPackage / offers.length).toFixed(2) : 0
    const maxInList = offers.length ? Math.max(...offers.map(o => o.package || 0)) : 0

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6 flex-wrap gap-4"
            >
                <div>
                    <h1 className="text-2xl text-heading">🎁 Placement Offers</h1>
                    <p className="text-sub mt-1">Filter by company, department, package, or date</p>
                </div>
                {offers.length > 0 && (
                    <button
                        onClick={() => exportToExcel(offers)}
                        className="btn-success text-sm"
                    >
                        ⬇️ Export to Excel ({offers.length})
                    </button>
                )}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="card mb-6"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div>
                        <label className="text-xs text-sub mb-1 block">Company</label>
                        <input
                            className="input text-sm w-full"
                            placeholder="e.g. Google"
                            value={company}
                            onChange={e => setCompany(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchOffers()}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-sub mb-1 block">Department</label>
                        <select
                            className="input text-sm w-full"
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {ALL_BRANCHES.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-sub mb-1 block">Min Package (LPA)</label>
                        <input
                            type="number" min="0"
                            className="input text-sm w-full"
                            placeholder="e.g. 5"
                            value={minPkg}
                            onChange={e => setMinPkg(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-sub mb-1 block">Max Package (LPA)</label>
                        <input
                            type="number" min="0"
                            className="input text-sm w-full"
                            placeholder="e.g. 20"
                            value={maxPkg}
                            onChange={e => setMaxPkg(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-sub mb-1 block">From Date</label>
                        <input
                            type="date"
                            className="input text-sm w-full"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-sub mb-1 block">To Date</label>
                        <input
                            type="date"
                            className="input text-sm w-full"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={fetchOffers} className="btn-primary text-sm">🔍 Apply Filters</button>
                    <button onClick={handleReset} className="btn-secondary text-sm">✕ Reset</button>
                </div>
            </motion.div>

            {/* Summary Cards */}
            {offers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-3 gap-4 mb-6"
                >
                    {[
                        { label: 'Total Offers', value: offers.length, color: 'text-blue-400' },
                        { label: 'Avg Package', value: `${avgPackage} LPA`, color: 'text-purple-400' },
                        { label: 'Highest Package', value: `${maxInList} LPA`, color: 'text-emerald-400' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <p className="text-sub text-xs">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Table */}
            {loading ? (
                <div className="card text-center text-sub py-16">Loading offers…</div>
            ) : offers.length === 0 ? (
                <div className="card text-center text-sub py-16">No offers match your filters.</div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card overflow-x-auto p-0"
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-sub">
                                <th className="text-left px-5 py-3 font-medium">Student</th>
                                <th className="text-left px-5 py-3 font-medium">Roll No</th>
                                <th className="text-left px-5 py-3 font-medium">Department</th>
                                <th className="text-right px-5 py-3 font-medium">CGPA</th>
                                <th className="text-left px-5 py-3 font-medium">Company</th>
                                <th className="text-right px-5 py-3 font-medium">Package (LPA)</th>
                                <th className="text-right px-5 py-3 font-medium">Offer Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map((o, i) => {
                                const student = o.users || {}
                                return (
                                    <motion.tr
                                        key={o.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                                    >
                                        <td className="px-5 py-3 font-semibold text-heading">{student.name || '—'}</td>
                                        <td className="px-5 py-3 text-sub">{student.roll_no || '—'}</td>
                                        <td className="px-5 py-3">
                                            {student.branch
                                                ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">{student.branch}</span>
                                                : <span className="text-sub">—</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3 text-right text-sub">{student.cgpa ?? '—'}</td>
                                        <td className="px-5 py-3 text-sub">{o.company}</td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="font-bold text-emerald-400">{o.package ?? '—'}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-sub text-xs">
                                            {o.offer_date ? new Date(o.offer_date).toLocaleDateString() : '—'}
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    )
}

export default OffersPage
