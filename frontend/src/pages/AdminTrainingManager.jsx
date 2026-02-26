// ============================================================
// AdminTrainingManager.jsx — Admin CRUD for Training Resources
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'

function AdminTrainingManager() {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ skill: '', title: '', link: '', type: 'video' })
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('')

    useEffect(() => { fetchResources() }, [])

    const fetchResources = async () => {
        try { const res = await api.get('/training'); setResources(res.data || []) }
        catch (err) { console.error('Failed to fetch:', err) }
        finally { setLoading(false) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('')
        try {
            if (editingId) {
                await api.put(`/training/${editingId}`, form)
            } else {
                await api.post('/training', form)
            }
            setForm({ skill: '', title: '', link: '', type: 'video' })
            setEditingId(null)
            fetchResources()
        } catch (err) { setError(err.response?.data?.detail || 'Failed to save') }
        finally { setSaving(false) }
    }

    const handleEdit = (resource) => {
        setForm({ skill: resource.skill, title: resource.title, link: resource.link || '', type: resource.type || 'video' })
        setEditingId(resource.id)
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this resource?')) return
        try { await api.delete(`/training/${id}`); fetchResources() }
        catch (err) { alert('Delete failed') }
    }

    const filteredResources = resources.filter((r) =>
        r.skill?.toLowerCase().includes(filter.toLowerCase()) ||
        r.title?.toLowerCase().includes(filter.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl text-heading">📚 Training Resource Manager</h1>
                <p className="text-sub mt-1">Add videos, blogs, courses and other learning resources for students</p>
            </div>

            {/* Add / Edit Form */}
            <div className="card mb-8">
                <h2 className="text-lg font-semibold text-heading mb-4">
                    {editingId ? '✏️ Edit Resource' : '➕ Add New Resource'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Skill / Category</label>
                            <input className="input" placeholder="e.g. Python, React, DSA"
                                value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label">Resource Title</label>
                            <input className="input" placeholder="e.g. Python Crash Course"
                                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label">URL / Link</label>
                            <input className="input" placeholder="https://youtube.com/watch?v=..."
                                value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Type</label>
                            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                <option value="video">🎥 Video</option>
                                <option value="blog">📝 Blog</option>
                                <option value="article">📰 Article</option>
                                <option value="course">🎓 Course</option>
                                <option value="documentation">📖 Documentation</option>
                                <option value="tutorial">📝 Tutorial</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Add Resource'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm({ skill: '', title: '', link: '', type: 'video' }) }}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Resource List */}
            <div className="mb-6">
                <input type="text" className="input max-w-md" placeholder="🔍 Filter resources..."
                    value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>

            <div className="card">
                <h2 className="text-lg font-semibold text-heading mb-4">
                    📋 All Resources ({filteredResources.length})
                </h2>

                {filteredResources.length > 0 ? (
                    <div className="space-y-3">
                        {filteredResources.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-current/5 hover:bg-primary-500/5 transition-all">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <span className="text-lg">
                                        {r.type === 'video' && '🎥'}
                                        {r.type === 'blog' && '📝'}
                                        {r.type === 'article' && '📰'}
                                        {r.type === 'course' && '🎓'}
                                        {r.type === 'documentation' && '📖'}
                                        {r.type === 'tutorial' && '📝'}
                                        {!r.type && '🔗'}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-medium text-heading text-sm truncate">{r.title}</p>
                                        <p className="text-xs text-sub">
                                            <span className="badge-applied text-xs">{r.skill}</span>
                                            {r.link && <span className="ml-2 truncate text-sub">{r.link}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-3">
                                    <button onClick={() => handleEdit(r)}
                                        className="px-3 py-1 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(r.id)}
                                        className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sub text-center py-8">No resources found.</p>
                )}
            </div>
        </div>
    )
}

export default AdminTrainingManager
