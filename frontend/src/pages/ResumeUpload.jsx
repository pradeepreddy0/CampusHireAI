// ============================================================
// ResumeUpload.jsx — Multi-Resume Upload & Management
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'

function ResumeUpload() {
    const [resumes, setResumes] = useState([])
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [label, setLabel] = useState('Resume')

    useEffect(() => { fetchResumes() }, [])

    const fetchResumes = async () => {
        try {
            const res = await api.get('/resume/my')
            if (Array.isArray(res.data)) setResumes(res.data)
        } catch { /* no resumes */ }
    }

    const handleUpload = async (file) => {
        if (!file) return
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Only PDF files are allowed'); return
        }
        setUploading(true); setError(''); setSuccess('')
        try {
            const formData = new FormData()
            formData.append('file', file)
            await api.post(`/resume/upload?label=${encodeURIComponent(label)}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setSuccess('Resume uploaded and parsed successfully!')
            setLabel('Resume')
            fetchResumes()
        } catch (err) { setError(err.response?.data?.detail || 'Upload failed') }
        finally { setUploading(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this resume?')) return
        try { await api.delete(`/resume/${id}`); fetchResumes() }
        catch { alert('Delete failed') }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl text-heading">📄 My Resumes</h1>
                <p className="text-sub mt-1">Upload multiple resumes for different roles</p>
            </div>

            {/* Upload Area */}
            <div className="card mb-6">
                <div className="mb-4">
                    <label className="label">Resume Label</label>
                    <input className="input" placeholder="e.g. SDE Resume, Data Science, General"
                        value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>

                <div
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
                        ${dragOver ? 'border-primary-400 bg-primary-500/5' : 'border-current/10 hover:border-primary-500/30'}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files[0]) }}
                    onClick={() => document.getElementById('resume-input').click()}
                >
                    <div className="text-4xl mb-3">{uploading ? '⏳' : '📤'}</div>
                    <p className="font-medium text-heading">
                        {uploading ? 'Uploading & parsing...' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-sub mt-1">PDF files only • You can upload multiple resumes</p>
                    <input id="resume-input" type="file" accept=".pdf" className="hidden"
                        onChange={(e) => handleUpload(e.target.files[0])} />
                </div>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">{error}</div>}
            {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm mb-6">{success}</div>}

            {/* Resumes List */}
            {resumes.length > 0 ? (
                <div className="space-y-4 stagger">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="card animate-fade-in">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-heading">{resume.label || 'Resume'}</h3>
                                    <p className="text-xs text-sub mt-1">
                                        Uploaded {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : ''}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {resume.resume_url && (
                                        <a href={resume.resume_url} target="_blank" rel="noopener noreferrer"
                                            className="px-3 py-1 text-xs font-medium rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all">
                                            View PDF
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(resume.id)}
                                        className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Skills */}
                            {resume.extracted_skills?.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-sub mb-1">Skills ({resume.extracted_skills.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {resume.extracted_skills.map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Projects */}
                            {resume.extracted_projects?.length > 0 && (
                                <div>
                                    <p className="text-xs text-sub mb-1">Projects ({resume.extracted_projects.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {resume.extracted_projects.map((p, i) => (
                                            <span key={i} className="badge-applied text-xs">{p.name || `Project ${i + 1}`}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sub text-lg">No resumes uploaded yet</p>
                    <p className="text-sub text-sm mt-2">Upload your first resume above!</p>
                </div>
            )}
        </div>
    )
}

export default ResumeUpload
