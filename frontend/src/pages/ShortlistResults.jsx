// ============================================================
// ShortlistResults.jsx — Shortlisting Results for a Drive
//
// Admin view: shows all applicants with scores, run shortlisting.
// Student view: shows results for a drive they applied to.
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
    const [threshold, setThreshold] = useState(0.5)

    useEffect(() => {
        fetchData()
    }, [driveId])

    const fetchData = async () => {
        try {
            const [driveRes, resultsRes] = await Promise.all([
                api.get(`/drives/${driveId}`),
                api.get(`/shortlist/${driveId}`),
            ])
            setDrive(driveRes.data)
            setResults(resultsRes.data || [])
        } catch (err) {
            console.error('Failed to load results:', err)
        } finally {
            setLoading(false)
        }
    }

    // Run shortlisting algorithm (admin only)
    const handleRunShortlist = async () => {
        setShortlisting(true)
        try {
            const res = await api.post('/shortlist', {
                drive_id: parseInt(driveId),
                threshold: parseFloat(threshold),
            })
            setShortlistResult(res.data)
            // Refresh the results list
            fetchData()
        } catch (err) {
            console.error('Shortlisting failed:', err)
            alert(err.response?.data?.detail || 'Shortlisting failed')
        } finally {
            setShortlisting(false)
        }
    }

    // Status badge helper
    const statusBadge = (status) => {
        const map = {
            Applied: 'badge-applied',
            Shortlisted: 'badge-shortlisted',
            Rejected: 'badge-rejected',
            Offered: 'badge-offered',
        }
        return map[status] || 'badge-applied'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <Link
                to={isAdmin ? '/admin/drives' : '/drives'}
                className="text-primary-600 hover:text-primary-700 text-sm mb-4 inline-block"
            >
                ← Back to Drives
            </Link>

            {/* ── Drive Header ──────────────────────────────── */}
            <div className="card mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                                {drive?.company_name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">{drive?.company_name}</h1>
                            <p className="text-gray-500 text-sm">{drive?.role}</p>
                        </div>
                    </div>

                    {/* Admin: Run Shortlisting Controls */}
                    {isAdmin && (
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-500 whitespace-nowrap">Threshold:</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    max="1"
                                    className="input w-20 text-sm"
                                    value={threshold}
                                    onChange={(e) => setThreshold(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleRunShortlist}
                                className="btn-primary text-sm"
                                disabled={shortlisting}
                            >
                                {shortlisting ? '⏳ Running...' : '🚀 Run Shortlisting'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Shortlisting Summary (after run) ──────────── */}
            {shortlistResult && (
                <div className="card mb-6 animate-slide-up bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <h3 className="font-semibold text-gray-800 mb-3">✅ Shortlisting Complete</h3>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                            <p className="text-gray-500">Total Processed</p>
                            <p className="text-2xl font-bold text-gray-800">{shortlistResult.total}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Shortlisted</p>
                            <p className="text-2xl font-bold text-green-600">{shortlistResult.shortlisted}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">{shortlistResult.rejected}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Results Table ────────────────────────────── */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    📋 Applicants ({results.length})
                </h2>

                {results.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Roll No</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Name</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Email</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Branch</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">CGPA</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">AI Score</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((app) => (
                                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2 font-mono text-xs">
                                            {app.users?.roll_no || '—'}
                                        </td>
                                        <td className="py-3 px-2 font-medium">{app.users?.name || '—'}</td>
                                        <td className="py-3 px-2 text-gray-600 text-xs">
                                            {app.users?.email || '—'}
                                        </td>
                                        <td className="py-3 px-2 text-gray-600">{app.users?.branch || '—'}</td>
                                        <td className="py-3 px-2 text-gray-600">{app.users?.cgpa || '—'}</td>
                                        <td className="py-3 px-2">
                                            <span className="font-medium">
                                                {app.ai_score ? (app.ai_score * 100).toFixed(1) + '%' : '—'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className={statusBadge(app.status)}>{app.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">
                        No applications yet for this drive.
                    </p>
                )}
            </div>
        </div>
    )
}

export default ShortlistResults
