// ============================================================
// ShortlistResults.jsx — Results + Top-N + 1.7× Filter + Admin Actions
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ShortlistResults() {
    const { driveId } = useParams()
    const { isAdmin } = useAuth()

    const [results, setResults] = useState([])
    const [drive, setDrive] = useState(null)
    const [loading, setLoading] = useState(true)
    const [shortlisting, setShortlisting] = useState(false)
    const [shortlistResult, setShortlistResult] = useState(null)

    // Shortlisting controls
    const [threshold, setThreshold] = useState(0.5)
    const [topN, setTopN] = useState('')
    const [applyOfferFilter, setApplyOfferFilter] = useState(false)

    const [notifying, setNotifying] = useState(false)
    const [placingId, setPlacingId] = useState(null)

    useEffect(() => { fetchData() }, [driveId])

    const fetchData = async () => {
        try {
            const [driveRes, resultsRes] = await Promise.all([
                api.get(`/drives/${driveId}`),
                api.get(`/shortlist/${driveId}`),
            ])
            setDrive(driveRes.data)
            setResults(resultsRes.data || [])
        } catch (err) { console.error('Failed to load results:', err) }
        finally { setLoading(false) }
    }

    const handleRunShortlist = async () => {
        setShortlisting(true)
        try {
            const payload = {
                drive_id: parseInt(driveId),
                threshold: parseFloat(threshold),
                top_n: topN ? parseInt(topN) : null,
                apply_offer_filter: applyOfferFilter,
            }
            const res = await api.post('/shortlist', payload)
            setShortlistResult(res.data)
            fetchData()
        } catch (err) {
            console.error('Shortlisting failed:', err)
            alert(err.response?.data?.detail || 'Shortlisting failed')
        } finally { setShortlisting(false) }
    }

    const handleNotifyShortlisted = async () => {
        setNotifying(true)
        try {
            const res = await api.post(`/shortlist/${driveId}/notify`)
            alert(`✅ ${res.data.message}`)
        } catch (err) { alert(err.response?.data?.detail || 'Failed to send notifications') }
        finally { setNotifying(false) }
    }

    const handleMarkPlaced = async (applicationId) => {
        const packageInput = prompt('Enter package (LPA):')
        if (!packageInput) return
        setPlacingId(applicationId)
        try {
            const res = await api.put(`/applications/${applicationId}/place`, { package: parseFloat(packageInput) })
            alert(`✅ ${res.data.message}`)
            fetchData()
        } catch (err) { alert(err.response?.data?.detail || 'Failed to mark as placed') }
        finally { setPlacingId(null) }
    }

    const statusBadge = (status) => {
        const map = {
            Applied: 'badge-applied', Shortlisted: 'badge-shortlisted',
            Rejected: 'badge-rejected', Offered: 'badge-offered', Placed: 'badge-placed',
        }
        return map[status] || 'badge-applied'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <Link to={isAdmin ? '/admin/drives' : '/drives'}
                className="text-primary-400 hover:text-primary-300 text-sm mb-4 inline-block transition-colors">
                ← Back to Drives
            </Link>

            {/* Drive Header + Controls */}
            <div className="card mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <span className="text-white font-bold text-lg">{drive?.company_name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                            <h1 className="text-xl text-heading">{drive?.company_name}</h1>
                            <p className="text-sub text-sm">{drive?.role} {drive?.package > 0 && `• ${drive.package} LPA`}</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <button onClick={handleNotifyShortlisted} className="btn-success text-sm" disabled={notifying}>
                            {notifying ? '⏳ Sending...' : '📧 Send Emails'}
                        </button>
                    )}
                </div>

                {/* Admin Shortlisting Controls */}
                {isAdmin && (
                    <div className="p-4 rounded-xl border border-current/5 space-y-4">
                        <h3 className="text-sm font-semibold text-heading">🚀 Shortlisting Controls</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="label">Threshold</label>
                                <input type="number" step="0.05" min="0" max="1" className="input text-sm"
                                    value={threshold} onChange={(e) => setThreshold(e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Top N (optional)</label>
                                <input type="number" min="1" className="input text-sm" placeholder="All"
                                    value={topN} onChange={(e) => setTopN(e.target.value)} />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded accent-primary-500"
                                        checked={applyOfferFilter} onChange={(e) => setApplyOfferFilter(e.target.checked)} />
                                    <span className="text-sm text-body">1.7× Offer Filter</span>
                                </label>
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleRunShortlist} className="btn-primary w-full text-sm" disabled={shortlisting}>
                                    {shortlisting ? '⏳ Running...' : '🚀 Run Shortlisting'}
                                </button>
                            </div>
                        </div>
                        {applyOfferFilter && (
                            <p className="text-xs text-sub">
                                ⚠️ Students whose best existing offer × 1.7 exceeds this drive's package ({drive?.package || 0} LPA) will be auto-rejected.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Shortlisting Summary */}
            {shortlistResult && (
                <div className="card mb-6 animate-slide-up border-emerald-500/20">
                    <h3 className="font-semibold text-heading mb-3">✅ Shortlisting Complete</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                        <div>
                            <p className="text-sub">Total</p>
                            <p className="text-2xl font-bold text-heading">{shortlistResult.total}</p>
                        </div>
                        <div>
                            <p className="text-sub">Shortlisted</p>
                            <p className="text-2xl font-bold text-emerald-400">{shortlistResult.shortlisted}</p>
                        </div>
                        <div>
                            <p className="text-sub">Rejected</p>
                            <p className="text-2xl font-bold text-red-400">{shortlistResult.rejected}</p>
                        </div>
                        <div>
                            <p className="text-sub">Filters</p>
                            <p className="text-xs text-body mt-1">
                                {shortlistResult.top_n ? `Top ${shortlistResult.top_n}` : 'No limit'}
                                {shortlistResult.offer_filter_applied ? ' + 1.7×' : ''}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="card">
                <h2 className="text-lg font-semibold text-heading mb-4">📋 Applicants ({results.length})</h2>

                {results.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-current/10">
                                    <th className="text-left py-3 px-2 font-medium text-sub">Roll No</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Name</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Email</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Branch</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">CGPA</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">AI Score</th>
                                    <th className="text-left py-3 px-2 font-medium text-sub">Status</th>
                                    {isAdmin && <th className="text-left py-3 px-2 font-medium text-sub">Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((app) => (
                                    <tr key={app.id} className="border-b border-current/5 hover:bg-primary-500/5 transition-colors">
                                        <td className="py-3 px-2 font-mono text-xs text-body">{app.users?.roll_no || '—'}</td>
                                        <td className="py-3 px-2 font-medium text-heading">{app.users?.name || '—'}</td>
                                        <td className="py-3 px-2 text-sub text-xs">{app.users?.email || '—'}</td>
                                        <td className="py-3 px-2 text-body">{app.users?.branch || '—'}</td>
                                        <td className="py-3 px-2 text-body">{app.users?.cgpa || '—'}</td>
                                        <td className="py-3 px-2">
                                            <span className="font-medium text-heading">
                                                {app.ai_score ? (app.ai_score * 100).toFixed(1) + '%' : '—'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2"><span className={statusBadge(app.status)}>{app.status}</span></td>
                                        {isAdmin && (
                                            <td className="py-3 px-2">
                                                {app.status === 'Shortlisted' && (
                                                    <button onClick={() => handleMarkPlaced(app.id)}
                                                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                                        disabled={placingId === app.id}>
                                                        {placingId === app.id ? '⏳...' : '✅ Place'}
                                                    </button>
                                                )}
                                                {app.status === 'Placed' && <span className="text-xs text-amber-400">✓ Placed</span>}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sub text-center py-8">No applications yet for this drive.</p>
                )}
            </div>
        </div>
    )
}

export default ShortlistResults
