// ============================================================
// ApplyDrive.jsx — Apply to a Placement Drive
//
// Shows drive details and a confirm-apply button.
// Also shows skill-gap analysis if the student has a resume.
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

function ApplyDrive() {
    const { driveId } = useParams()
    const navigate = useNavigate()

    const [drive, setDrive] = useState(null)
    const [skillGap, setSkillGap] = useState(null)
    const [loading, setLoading] = useState(true)
    const [applying, setApplying] = useState(false)
    const [applied, setApplied] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [driveId])

    const fetchData = async () => {
        try {
            // Fetch drive details and skill-gap analysis in parallel
            const [driveRes, gapRes] = await Promise.all([
                api.get(`/drives/${driveId}`),
                api.get(`/skill-gap/${driveId}`).catch(() => ({ data: null })),
            ])
            setDrive(driveRes.data)
            setSkillGap(gapRes.data)
        } catch (err) {
            setError('Failed to load drive details')
        } finally {
            setLoading(false)
        }
    }

    const handleApply = async () => {
        setApplying(true)
        setError('')

        try {
            await api.post('/applications', { drive_id: parseInt(driveId) })
            setApplied(true)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to apply')
        } finally {
            setApplying(false)
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <Link to="/drives" className="text-primary-600 hover:text-primary-700 text-sm mb-4 inline-block">
                ← Back to Drives
            </Link>

            {/* ── Drive Details Card ────────────────────────── */}
            <div className="card mb-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                            {drive?.company_name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{drive?.company_name}</h1>
                        <p className="text-gray-500">{drive?.role}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Min CGPA</p>
                        <p className="font-semibold text-lg">{drive?.eligibility_cgpa}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500">Deadline</p>
                        <p className="font-semibold text-lg">
                            {drive?.deadline ? new Date(drive.deadline).toLocaleDateString() : 'Open'}
                        </p>
                    </div>
                </div>

                {/* Required Skills */}
                {drive?.required_skills?.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {drive.required_skills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error / Success */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                        {error}
                    </div>
                )}

                {applied ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <p className="text-green-700 font-medium">✅ Application submitted successfully!</p>
                        <Link to="/student/dashboard" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
                            View your applications →
                        </Link>
                    </div>
                ) : (
                    <button
                        onClick={handleApply}
                        className="btn-primary w-full"
                        disabled={applying}
                    >
                        {applying ? 'Submitting...' : 'Apply to this Drive'}
                    </button>
                )}
            </div>

            {/* ── Skill Gap Analysis ────────────────────────── */}
            {skillGap && !skillGap.error && (
                <div className="card animate-slide-up">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">🧠 Skill Gap Analysis</h2>

                    {/* Match percentage */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Skill Match</span>
                            <span className="font-medium">{skillGap.match_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${skillGap.match_percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Matched skills */}
                    {skillGap.matched_skills?.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-green-700 mb-2">✅ Matched Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {skillGap.matched_skills.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing skills */}
                    {skillGap.missing_skills?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-red-700 mb-2">❌ Missing Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {skillGap.missing_skills.map((s, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                                        {s}
                                    </span>
                                ))}
                            </div>
                            <Link
                                to="/training"
                                className="mt-3 inline-block text-sm text-primary-600 hover:underline"
                            >
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
