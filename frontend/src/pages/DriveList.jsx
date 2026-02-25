// ============================================================
// DriveList.jsx — Placement Drives Listing
//
// Shows all drives in a card grid.
// Students see "Apply" button; Admins see "Shortlist" + "Export".
// Admins also get a "Create Drive" form modal.
// ============================================================

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function DriveList() {
    const { isAdmin } = useAuth()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)

    // Create drive form state
    const [newDrive, setNewDrive] = useState({
        company_name: '',
        role: '',
        eligibility_cgpa: '',
        required_skills: '',
        deadline: '',
    })
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState('')

    useEffect(() => {
        fetchDrives()
    }, [])

    const fetchDrives = async () => {
        try {
            const res = await api.get('/drives')
            setDrives(res.data || [])
        } catch (err) {
            console.error('Failed to fetch drives:', err)
        } finally {
            setLoading(false)
        }
    }

    // Handle drive creation (admin only)
    const handleCreateDrive = async (e) => {
        e.preventDefault()
        setCreateLoading(true)
        setCreateError('')

        try {
            const payload = {
                company_name: newDrive.company_name,
                role: newDrive.role,
                eligibility_cgpa: parseFloat(newDrive.eligibility_cgpa) || 0,
                // Convert comma-separated skills into array
                required_skills: newDrive.required_skills
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                deadline: newDrive.deadline || null,
            }

            await api.post('/drives', payload)
            setShowCreate(false)
            setNewDrive({ company_name: '', role: '', eligibility_cgpa: '', required_skills: '', deadline: '' })
            fetchDrives() // Refresh list
        } catch (err) {
            setCreateError(err.response?.data?.detail || 'Failed to create drive')
        } finally {
            setCreateLoading(false)
        }
    }

    // Handle Excel export (admin only)
    const handleExport = async (driveId) => {
        try {
            const res = await api.get(`/export-shortlisted/${driveId}`, {
                responseType: 'blob',
            })
            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `shortlisted_drive_${driveId}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            alert(err.response?.data?.detail || 'No shortlisted students to export')
        }
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🏢 Placement Drives</h1>
                    <p className="text-gray-500 mt-1">
                        {drives.length} active drive{drives.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="btn-primary"
                    >
                        + Create Drive
                    </button>
                )}
            </div>

            {/* ── Create Drive Form (Admin) ─────────────────── */}
            {showCreate && isAdmin && (
                <div className="card mb-8 animate-slide-up">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Drive</h2>
                    <form onSubmit={handleCreateDrive} className="space-y-4">
                        {createError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {createError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Company Name</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Google"
                                    value={newDrive.company_name}
                                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Job Role</label>
                                <input
                                    className="input"
                                    placeholder="e.g. SDE Intern"
                                    value={newDrive.role}
                                    onChange={(e) => setNewDrive({ ...newDrive, role: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Minimum CGPA</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    className="input"
                                    placeholder="e.g. 7.0"
                                    value={newDrive.eligibility_cgpa}
                                    onChange={(e) => setNewDrive({ ...newDrive, eligibility_cgpa: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Deadline</label>
                                <input
                                    type="datetime-local"
                                    className="input"
                                    value={newDrive.deadline}
                                    onChange={(e) => setNewDrive({ ...newDrive, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Required Skills (comma-separated)</label>
                            <input
                                className="input"
                                placeholder="e.g. Python, React, SQL, Git"
                                value={newDrive.required_skills}
                                onChange={(e) => setNewDrive({ ...newDrive, required_skills: e.target.value })}
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button type="submit" className="btn-primary" disabled={createLoading}>
                                {createLoading ? 'Creating...' : 'Create Drive'}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowCreate(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Drive Cards Grid ──────────────────────────── */}
            {drives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {drives.map((drive) => (
                        <div key={drive.id} className="card hover:border-primary-200">
                            {/* Company header */}
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-700 font-bold text-sm">
                                        {drive.company_name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{drive.company_name}</h3>
                                    <p className="text-sm text-gray-500">{drive.role}</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Min CGPA</span>
                                    <span className="font-medium text-gray-700">{drive.eligibility_cgpa}</span>
                                </div>
                                {drive.deadline && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Deadline</span>
                                        <span className="font-medium text-gray-700">
                                            {new Date(drive.deadline).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            {drive.required_skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {drive.required_skills.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-2 pt-3 border-t border-gray-100">
                                {isAdmin ? (
                                    <>
                                        <Link
                                            to={`/admin/shortlist/${drive.id}`}
                                            className="btn-primary text-xs flex-1 text-center"
                                        >
                                            Shortlist
                                        </Link>
                                        <button
                                            onClick={() => handleExport(drive.id)}
                                            className="btn-secondary text-xs flex-1"
                                        >
                                            Export
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to={`/drives/${drive.id}/apply`}
                                        className="btn-primary text-xs flex-1 text-center"
                                    >
                                        Apply Now
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-gray-400 text-lg">No drives available yet</p>
                    {isAdmin && (
                        <p className="text-gray-400 text-sm mt-2">
                            Click "Create Drive" to add the first one.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

export default DriveList
