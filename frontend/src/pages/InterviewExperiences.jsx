// ============================================================
// InterviewExperiences.jsx — View/Add Interview Experiences
// Admin: add/delete. Students: view.
// ============================================================

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function InterviewExperiences() {
    const { driveId } = useParams()
    const { isAdmin } = useAuth()

    const [experiences, setExperiences] = useState([])
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ drive_id: driveId || '', title: '', content: '', tips: '' })
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchExperiences()
        fetchDrives()
    }, [driveId])

    const fetchExperiences = async () => {
        try {
            const url = driveId ? `/experiences/${driveId}` : '/experiences'
            const res = await api.get(url)
            setExperiences(res.data || [])
        } catch (err) { console.error('Failed to fetch:', err) }
        finally { setLoading(false) }
    }

    const fetchDrives = async () => {
        try { const res = await api.get('/drives'); setDrives(res.data || []) }
        catch { /* ignore */ }
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('')
        try {
            await api.post('/experiences', {
                drive_id: form.drive_id ? parseInt(form.drive_id) : null,
                title: form.title,
                content: form.content,
                tips: form.tips || null,
            })
            setForm({ drive_id: driveId || '', title: '', content: '', tips: '' })
            setShowForm(false)
            fetchExperiences()
        } catch (err) { setError(err.response?.data?.detail || 'Failed to save') }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this experience?')) return
        try { await api.delete(`/experiences/${id}`); fetchExperiences() }
        catch { alert('Delete failed') }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl text-heading">💡 Interview Experiences & Prep</h1>
                    <p className="text-sub mt-1">
                        {driveId ? 'Experiences for this drive' : 'Previous year questions, experiences & admin tips'}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                        + Add Experience
                    </button>
                )}
            </div>

            {/* Admin Add Form */}
            {showForm && isAdmin && (
                <div className="card mb-8 animate-slide-up">
                    <h2 className="text-lg font-semibold text-heading mb-4">Add Interview Experience / Tips</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Linked Drive (optional)</label>
                                <select className="input" value={form.drive_id} onChange={(e) => setForm({ ...form, drive_id: e.target.value })}>
                                    <option value="">General (no specific drive)</option>
                                    {drives.map((d) => (
                                        <option key={d.id} value={d.id}>{d.company_name} — {d.role}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Title</label>
                                <input className="input" placeholder="e.g. TCS Interview Questions 2024"
                                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                            </div>
                        </div>

                        <div>
                            <label className="label">Experience / Questions</label>
                            <textarea className="input min-h-[120px]" placeholder="Write about the interview process, rounds, questions asked..."
                                value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                        </div>

                        <div>
                            <label className="label">Preparation Tips (optional)</label>
                            <textarea className="input min-h-[80px]" placeholder="Tips for students preparing for this company..."
                                value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })} />
                        </div>

                        <div className="flex space-x-3">
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Add Experience'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Experience List */}
            {experiences.length > 0 ? (
                <div className="space-y-4 stagger">
                    {experiences.map((exp) => (
                        <div key={exp.id} className="card animate-fade-in">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <h3 className="font-semibold text-heading">{exp.title}</h3>
                                        {exp.drives && (
                                            <span className="badge-applied text-xs">
                                                {exp.drives.company_name} — {exp.drives.role}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-body mb-1">📝 Experience / Questions</h4>
                                        <div className="text-body whitespace-pre-wrap text-sm p-3 rounded-xl border border-current/5">
                                            {exp.content}
                                        </div>
                                    </div>

                                    {exp.tips && (
                                        <div>
                                            <h4 className="text-sm font-medium text-emerald-400 mb-1">💡 Preparation Tips</h4>
                                            <div className="text-body whitespace-pre-wrap text-sm p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                                {exp.tips}
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-sub mt-3">
                                        Added {exp.created_at ? new Date(exp.created_at).toLocaleDateString() : ''}
                                    </p>
                                </div>

                                {isAdmin && (
                                    <button onClick={() => handleDelete(exp.id)}
                                        className="ml-3 px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sub text-lg">No interview experiences shared yet</p>
                    {isAdmin && <p className="text-sub text-sm mt-2">Click "Add Experience" to share insights with students.</p>}
                </div>
            )}
        </div>
    )
}

export default InterviewExperiences
