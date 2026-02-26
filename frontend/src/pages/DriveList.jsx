// ============================================================
// DriveList.jsx — Drives + JD Upload/Download + Package
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function DriveList() {
    const { isAdmin } = useAuth()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newDrive, setNewDrive] = useState({
        company_name: '', role: '', eligibility_cgpa: '',
        required_skills: '', deadline: '', package: '',
    })
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState('')
    const [uploadingJd, setUploadingJd] = useState(null)
    const jdInputRef = useRef(null)

    useEffect(() => { fetchDrives() }, [])

    const fetchDrives = async () => {
        try { const res = await api.get('/drives'); setDrives(res.data || []) }
        catch (err) { console.error('Failed to fetch drives:', err) }
        finally { setLoading(false) }
    }

    const handleCreateDrive = async (e) => {
        e.preventDefault(); setCreateLoading(true); setCreateError('')
        try {
            await api.post('/drives', {
                company_name: newDrive.company_name,
                role: newDrive.role,
                eligibility_cgpa: parseFloat(newDrive.eligibility_cgpa) || 0,
                required_skills: newDrive.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
                deadline: newDrive.deadline || null,
                package: parseFloat(newDrive.package) || 0,
            })
            setShowCreate(false)
            setNewDrive({ company_name: '', role: '', eligibility_cgpa: '', required_skills: '', deadline: '', package: '' })
            fetchDrives()
        } catch (err) { setCreateError(err.response?.data?.detail || 'Failed to create drive') }
        finally { setCreateLoading(false) }
    }

    const handleJdUpload = async (driveId, file) => {
        if (!file) return
        setUploadingJd(driveId)
        try {
            const formData = new FormData()
            formData.append('file', file)
            await api.post(`/drives/${driveId}/jd`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            fetchDrives()
        } catch (err) { alert(err.response?.data?.detail || 'JD upload failed') }
        finally { setUploadingJd(null) }
    }

    const handleExport = async (driveId) => {
        try {
            const res = await api.get(`/export-shortlisted/${driveId}`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a'); link.href = url
            link.setAttribute('download', `shortlisted_drive_${driveId}.xlsx`)
            document.body.appendChild(link); link.click(); link.remove()
        } catch (err) { alert(err.response?.data?.detail || 'No shortlisted students to export') }
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl text-heading">🏢 Placement Drives</h1>
                    <p className="text-sub mt-1">{drives.length} active drive{drives.length !== 1 ? 's' : ''}</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">+ Create Drive</button>
                )}
            </div>

            {/* Create Drive Form */}
            {showCreate && isAdmin && (
                <div className="card mb-8 animate-slide-up">
                    <h2 className="text-lg font-semibold text-heading mb-4">Create New Drive</h2>
                    <form onSubmit={handleCreateDrive} className="space-y-4">
                        {createError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{createError}</div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Company Name</label>
                                <input className="input" placeholder="e.g. Google" value={newDrive.company_name}
                                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="label">Job Role</label>
                                <input className="input" placeholder="e.g. SDE Intern" value={newDrive.role}
                                    onChange={(e) => setNewDrive({ ...newDrive, role: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="label">Minimum CGPA</label>
                                <input type="number" step="0.01" min="0" max="10" className="input" placeholder="e.g. 7.0"
                                    value={newDrive.eligibility_cgpa} onChange={(e) => setNewDrive({ ...newDrive, eligibility_cgpa: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Package (LPA)</label>
                                <input type="number" step="0.01" min="0" className="input" placeholder="e.g. 12.0"
                                    value={newDrive.package} onChange={(e) => setNewDrive({ ...newDrive, package: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Deadline</label>
                                <input type="datetime-local" className="input" value={newDrive.deadline}
                                    onChange={(e) => setNewDrive({ ...newDrive, deadline: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="label">Required Skills (comma-separated)</label>
                            <input className="input" placeholder="e.g. Python, React, SQL, Git" value={newDrive.required_skills}
                                onChange={(e) => setNewDrive({ ...newDrive, required_skills: e.target.value })} />
                        </div>
                        <div className="flex space-x-3">
                            <button type="submit" className="btn-primary" disabled={createLoading}>
                                {createLoading ? 'Creating...' : 'Create Drive'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Drive Cards */}
            {drives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
                    {drives.map((drive) => (
                        <div key={drive.id} className="card animate-fade-in">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 rounded-xl flex items-center justify-center">
                                    <span className="text-primary-400 font-bold text-sm">{drive.company_name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-heading">{drive.company_name}</h3>
                                    <p className="text-sm text-sub">{drive.role}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-sub">Min CGPA</span>
                                    <span className="font-medium text-body">{drive.eligibility_cgpa}</span>
                                </div>
                                {drive.package > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sub">Package</span>
                                        <span className="font-medium text-emerald-400">{drive.package} LPA</span>
                                    </div>
                                )}
                                {drive.deadline && (
                                    <div className="flex justify-between">
                                        <span className="text-sub">Deadline</span>
                                        <span className="font-medium text-body">{new Date(drive.deadline).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {drive.required_skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {drive.required_skills.map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* JD Download / Upload */}
                            {drive.jd_url && (
                                <div className="mb-4">
                                    <a href={drive.jd_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                                        <span>📄</span>
                                        <span className="font-medium">View / Download JD</span>
                                    </a>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-3 border-t border-current/5">
                                {isAdmin ? (
                                    <>
                                        <Link to={`/admin/shortlist/${drive.id}`} className="btn-primary text-xs flex-1 text-center">Shortlist</Link>
                                        <button onClick={() => handleExport(drive.id)} className="btn-secondary text-xs">📥 Export</button>
                                        <label className="btn-secondary text-xs cursor-pointer">
                                            {uploadingJd === drive.id ? '⏳...' : '📄 Upload JD'}
                                            <input type="file" accept=".pdf,.docx" className="hidden"
                                                onChange={(e) => handleJdUpload(drive.id, e.target.files[0])} />
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <Link to={`/drives/${drive.id}/apply`} className="btn-primary text-xs flex-1 text-center">Apply Now</Link>
                                        <Link to={`/experiences/${drive.id}`} className="btn-secondary text-xs">💡 Prep</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-sub text-lg">No drives available yet</p>
                </div>
            )}
        </div>
    )
}

export default DriveList
