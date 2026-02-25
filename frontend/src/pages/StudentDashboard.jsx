// ============================================================
// StudentDashboard.jsx — Student Home Page
//
// Shows:
//   - Profile summary card
//   - Resume status & extracted skills
//   - Recent applications with status badges
//   - Quick action links
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function StudentDashboard() {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [resume, setResume] = useState(null)
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch profile, resume, and applications in parallel
            const [profileRes, resumeRes, appsRes] = await Promise.all([
                api.get('/me'),
                api.get('/resume/my'),
                api.get('/applications/my'),
            ])
            setProfile(profileRes.data)
            setResume(resumeRes.data)
            setApplications(appsRes.data || [])
        } catch (err) {
            console.error('Failed to load dashboard:', err)
        } finally {
            setLoading(false)
        }
    }

    // Helper: get badge class based on application status
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
            {/* ── Header ──────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome back, <span className="text-primary-600">{user?.name}</span>! 👋
                </h1>
                <p className="text-gray-500 mt-1">Here's your placement overview</p>
            </div>

            {/* ── Quick Stats ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-700">
                    <p className="text-blue-100 text-sm">CGPA</p>
                    <p className="text-3xl font-bold">{profile?.cgpa || '—'}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-green-500 to-green-700">
                    <p className="text-green-100 text-sm">Applications</p>
                    <p className="text-3xl font-bold">{applications.length}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-purple-500 to-purple-700">
                    <p className="text-purple-100 text-sm">Shortlisted</p>
                    <p className="text-3xl font-bold">
                        {applications.filter((a) => a.status === 'Shortlisted').length}
                    </p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-amber-500 to-amber-700">
                    <p className="text-amber-100 text-sm">Offers</p>
                    <p className="text-3xl font-bold">
                        {applications.filter((a) => a.status === 'Offered').length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Profile Card ────────────────────────────────── */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Profile</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Roll No</span>
                            <span className="font-medium">{profile?.roll_no}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{profile?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Branch</span>
                            <span className="font-medium">{profile?.branch || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">CGPA</span>
                            <span className="font-medium">{profile?.cgpa}</span>
                        </div>
                    </div>
                </div>

                {/* ── Resume Skills Card ──────────────────────────── */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">🛠️ Resume Skills</h2>
                    {resume?.extracted_skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {resume.extracted_skills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-400 mb-3">No resume uploaded yet</p>
                            <Link to="/resume/upload" className="btn-primary text-sm">
                                Upload Resume
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Quick Actions Card ──────────────────────────── */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Quick Actions</h2>
                    <div className="space-y-3">
                        <Link
                            to="/drives"
                            className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium text-gray-700 hover:text-primary-700"
                        >
                            🏢 Browse Placement Drives
                        </Link>
                        <Link
                            to="/resume/upload"
                            className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium text-gray-700 hover:text-primary-700"
                        >
                            📄 Upload / Update Resume
                        </Link>
                        <Link
                            to="/training"
                            className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium text-gray-700 hover:text-primary-700"
                        >
                            📚 View Training Resources
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Recent Applications ───────────────────────────── */}
            <div className="card mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Recent Applications</h2>
                {applications.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Company</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Role</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">AI Score</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-500">Applied</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2 font-medium">{app.drives?.company_name || '—'}</td>
                                        <td className="py-3 px-2 text-gray-600">{app.drives?.role || '—'}</td>
                                        <td className="py-3 px-2">
                                            <span className={statusBadge(app.status)}>{app.status}</span>
                                        </td>
                                        <td className="py-3 px-2 text-gray-600">
                                            {app.ai_score ? (app.ai_score * 100).toFixed(1) + '%' : '—'}
                                        </td>
                                        <td className="py-3 px-2 text-gray-400">
                                            {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-6">
                        No applications yet. <Link to="/drives" className="text-primary-600 hover:underline">Browse drives</Link> to get started.
                    </p>
                )}
            </div>
        </div>
    )
}

export default StudentDashboard
