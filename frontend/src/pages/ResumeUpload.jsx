// ============================================================
// ResumeUpload.jsx — Resume Upload & Skill Extraction
//
// Lets students upload a PDF resume.
// After upload, shows extracted skills and projects.
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'

function ResumeUpload() {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [existing, setExisting] = useState(null)
    const [error, setError] = useState('')
    const [dragActive, setDragActive] = useState(false)

    // Fetch existing resume on mount
    useEffect(() => {
        fetchExisting()
    }, [])

    const fetchExisting = async () => {
        try {
            const res = await api.get('/resume/my')
            if (res.data && res.data.extracted_skills) {
                setExisting(res.data)
            }
        } catch {
            // No existing resume — that's fine
        }
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if (selected && selected.type === 'application/pdf') {
            setFile(selected)
            setError('')
        } else {
            setError('Please select a PDF file')
        }
    }

    // Drag & drop handlers
    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
        else if (e.type === 'dragleave') setDragActive(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped && dropped.type === 'application/pdf') {
            setFile(dropped)
            setError('')
        } else {
            setError('Please drop a PDF file')
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setError('')

        try {
            // Send file as FormData
            const formData = new FormData()
            formData.append('file', file)

            const res = await api.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            setResult(res.data.data)
            setFile(null) // Clear file input
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    // Use result if just uploaded, otherwise show existing
    const displayData = result || existing

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">📄 Resume Upload</h1>
                <p className="text-gray-500 mt-1">
                    Upload your resume as a PDF. We'll extract your skills automatically.
                </p>
            </div>

            {/* ── Upload Area ───────────────────────────────── */}
            <div className="card mb-6">
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${dragActive
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="text-4xl mb-3">📤</div>
                    <p className="text-gray-600 mb-2">
                        <span className="font-medium">Drag & drop</span> your resume here, or
                    </p>

                    <label className="btn-secondary cursor-pointer inline-block">
                        Browse Files
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>

                    <p className="text-xs text-gray-400 mt-3">PDF files only, max 10 MB</p>
                </div>

                {/* Selected file */}
                {file && (
                    <div className="mt-4 flex items-center justify-between bg-primary-50 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">📋</span>
                            <div>
                                <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleUpload}
                            className="btn-primary text-sm"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <span className="flex items-center space-x-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    <span>Parsing...</span>
                                </span>
                            ) : (
                                'Upload & Parse'
                            )}
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* ── Extraction Results ────────────────────────── */}
            {displayData && (
                <div className="space-y-6 animate-slide-up">
                    {result && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            ✅ Resume uploaded and parsed successfully!
                        </div>
                    )}

                    {/* Extracted Skills */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">🛠️ Extracted Skills</h2>
                        {displayData.extracted_skills?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {displayData.extracted_skills.map((skill, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700 border border-primary-200 rounded-full text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No skills detected</p>
                        )}
                    </div>

                    {/* Extracted Projects */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">📁 Detected Projects</h2>
                        {displayData.extracted_projects?.length > 0 ? (
                            <div className="space-y-3">
                                {displayData.extracted_projects.map((proj, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="font-medium text-gray-800 text-sm">{proj.name}</p>
                                        {proj.description !== proj.name && (
                                            <p className="text-xs text-gray-500 mt-1">{proj.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No projects detected</p>
                        )}
                    </div>

                    {/* Resume URL */}
                    {displayData.resume_url && (
                        <div className="text-center">
                            <a
                                href={displayData.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                📥 View uploaded resume →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ResumeUpload
