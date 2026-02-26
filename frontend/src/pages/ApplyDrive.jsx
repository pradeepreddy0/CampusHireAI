// ============================================================
// ApplyDrive.jsx — Apply to Drive with Resume Selection
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

function ApplyDrive() {
    const { driveId } = useParams()
    const navigate = useNavigate()

    const [drive, setDrive] = useState(null)
    const [skillGap, setSkillGap] = useState(null)
    const [resumes, setResumes] = useState([])
    const [selectedResumeId, setSelectedResumeId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [applied, setApplied] = useState(false)
    const [error, setError] = useState('')
    const [uploadingNew, setUploadingNew] = useState(false)

    useEffect(() => { fetchData() }, [driveId])

    const fetchData = async () => {
        try {
            const [driveRes, gapRes, resumeRes] = await Promise.all([
                api.get(`/drives/${driveId}`),
                api.get(`/skill-gap/${driveId}`).catch(() => ({ data: null })),
                api.get('/resume/my').catch(() => ({ data: [] })),
            ])
            setDrive(driveRes.data)
            setSkillGap(gapRes.data)
            const resumeList = Array.isArray(resumeRes.data) ? resumeRes.data : []
            setResumes(resumeList)
            if (resumeList.length > 0) setSelectedResumeId(resumeList[0].id)
        } catch { setError('Failed to load drive details') }
        finally { setLoading(false) }
    }

    const handleApply = async () => {
        setApplying(true); setError('')
        try {
            const body = { drive_id: parseInt(driveId) }
            if (selectedResumeId) body.resume_id = selectedResumeId
            await api.post('/applications', body)
            setApplied(true)
        }
        catch (err) { setError(err.response?.data?.detail || 'Failed to apply') }
        finally { setApplying(false) }
    }

    const handleNewUpload = async (file) => {
        if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
            setError('Only PDF files are allowed'); return
        }
        setUploadingNew(true); setError('')
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await api.post(`/resume/upload?label=${encodeURIComponent(file.name.replace('.pdf', ''))}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            // Refresh resumes and select the newly uploaded one
            const newId = res.data?.data?.resume_id
            const resumeRes = await api.get('/resume/my')
            const list = Array.isArray(resumeRes.data) ? resumeRes.data : []
            setResumes(list)
            if (newId) setSelectedResumeId(newId)
            else if (list.length > 0) setSelectedResumeId(list[0].id)
        } catch (err) { setError(err.response?.data?.detail || 'Upload failed') }
        finally { setUploadingNew(false) }
    }

    const selectedResume = resumes.find(r => r.id === selectedResumeId)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <Link to="/drives" className="text-primary-400 hover:text-primary-300 text-sm mb-4 inline-block transition-colors">
                ← Back to Drives
            </Link>

            <div className="card mb-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <span className="text-white font-bold text-xl">{drive?.company_name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl text-heading">{drive?.company_name}</h1>
                        <p className="text-sub">{drive?.role}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="p-3 rounded-xl border border-current/5">
                        <p className="text-sub">Min CGPA</p>
                        <p className="font-semibold text-lg text-heading">{drive?.eligibility_cgpa}</p>
                    </div>
                    {drive?.package > 0 && (
                        <div className="p-3 rounded-xl border border-current/5">
                            <p className="text-sub">Package</p>
                            <p className="font-semibold text-lg text-emerald-400">{drive.package} LPA</p>
                        </div>
                    )}
                    <div className="p-3 rounded-xl border border-current/5">
                        <p className="text-sub">Deadline</p>
                        <p className="font-semibold text-lg text-heading">
                            {drive?.deadline ? new Date(drive.deadline).toLocaleDateString() : 'Open'}
                        </p>
                    </div>
                </div>

                {/* JD Download */}
                {drive?.jd_url && (
                    <div className="mb-6 p-4 rounded-xl border border-primary-500/20 bg-primary-500/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className="font-medium text-heading text-sm">Job Description Available</p>
                                    <p className="text-xs text-sub">Download and review the full JD</p>
                                </div>
                            </div>
                            <a href={drive.jd_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                                Download JD
                            </a>
                        </div>
                    </div>
                )}

                {drive?.required_skills?.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-sub mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {drive.required_skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full text-sm font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resume Selection */}
                {!applied && (
                    <div className="mb-6 p-4 rounded-xl border border-current/5 bg-current/[0.02]">
                        <h3 className="text-sm font-medium text-heading mb-3">📎 Select Resume for this Application</h3>

                        {resumes.length > 0 ? (
                            <div className="space-y-2 mb-3">
                                {resumes.map((r) => (
                                    <label key={r.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                                            ${selectedResumeId === r.id
                                                ? 'border-primary-500 bg-primary-500/5'
                                                : 'border-current/10 hover:border-primary-500/30'}`}
                                        onClick={() => setSelectedResumeId(r.id)}>
                                        <div className="flex items-center space-x-3">
                                            <input type="radio" name="resume" checked={selectedResumeId === r.id}
                                                onChange={() => setSelectedResumeId(r.id)}
                                                className="accent-purple-500" />
                                            <div>
                                                <p className="font-medium text-heading text-sm">{r.label || 'Resume'}</p>
                                                <p className="text-xs text-sub">
                                                    {(r.extracted_skills || []).length} skills • {new Date(r.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {r.resume_url && (
                                            <a href={r.resume_url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-primary-400 hover:underline"
                                                onClick={(e) => e.stopPropagation()}>
                                                View
                                            </a>
                                        )}
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sub text-sm mb-3">No resumes uploaded yet. Upload one below or from the Resume page.</p>
                        )}

                        {/* Upload new resume inline */}
                        <div className="flex items-center space-x-2">
                            <button onClick={() => document.getElementById('inline-resume-input').click()}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all"
                                disabled={uploadingNew}>
                                {uploadingNew ? 'Uploading...' : '+ Upload New Resume'}
                            </button>
                            <input id="inline-resume-input" type="file" accept=".pdf" className="hidden"
                                onChange={(e) => handleNewUpload(e.target.files[0])} />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">{error}</div>
                )}

                {applied ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                        <p className="text-emerald-400 font-medium">✅ Application submitted successfully!</p>
                        <Link to="/student/dashboard" className="text-primary-400 hover:underline text-sm mt-2 inline-block">
                            View your applications →
                        </Link>
                    </div>
                ) : (
                    <button onClick={handleApply} className="btn-primary w-full" disabled={applying}>
                        {applying ? 'Submitting...' : `Apply${selectedResume ? ` with "${selectedResume.label}"` : ''}`}
                    </button>
                )}

                {/* Interview Prep Link */}
                <div className="mt-4 text-center">
                    <Link to={`/experiences/${driveId}`} className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                        💡 View interview experiences & prep tips for this company →
                    </Link>
                </div>
            </div>

            {/* Skill Gap Analysis */}
            {skillGap && !skillGap.error && (
                <div className="card animate-slide-up">
                    <h2 className="text-lg font-semibold text-heading mb-4">🧠 Skill Gap Analysis</h2>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-sub">Skill Match</span>
                            <span className="font-medium text-heading">{skillGap.match_percentage}%</span>
                        </div>
                        <div className="w-full bg-current/10 rounded-full h-2.5">
                            <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${skillGap.match_percentage}%` }}></div>
                        </div>
                    </div>

                    {skillGap.matched_skills?.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-emerald-400 mb-2">✅ Matched Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {skillGap.matched_skills.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {skillGap.missing_skills?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-red-400 mb-2">❌ Missing Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {skillGap.missing_skills.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs">{s}</span>
                                ))}
                            </div>
                            <Link to="/training" className="mt-3 inline-block text-sm text-primary-400 hover:underline">
                                📚 View training resources for these skills →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ApplyDrive
