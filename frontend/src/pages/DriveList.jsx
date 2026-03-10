// ============================================================
// DriveList.jsx — Premium Drive Cards with search, filter & modal
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { SpinnerPage } from '../components/ui/Spinner'

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const cardVariant = {
    hidden: { opacity: 0, y: 28, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
}

const COMPANY_COLORS = [
    { from: '#4338ca', to: '#312e81' },
    { from: '#7c3aed', to: '#4c1d95' },
    { from: '#0d9488', to: '#134e4a' },
    { from: '#e11d48', to: '#881337' },
    { from: '#475569', to: '#1e293b' },
    { from: '#0891b2', to: '#164e63' },
    { from: '#c026d3', to: '#701a75' },
]

function getCountdown(deadline) {
    if (!deadline) return null
    const diff = new Date(deadline) - new Date()
    if (diff < 0) return 'Deadline passed'
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    if (d > 0) return `${d}d ${h}h left`
    return `${h}h left`
}

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'package', label: 'Highest Package' },
    { value: 'cgpa', label: 'Lowest CGPA' },
]

function DriveList() {
    const { isAdmin } = useAuth()
    const [drives, setDrives] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [createError, setCreateError] = useState('')
    const [uploadingJd, setUploadingJd] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('newest')
    const [newDrive, setNewDrive] = useState({
        company_name: '', role: '', eligibility_cgpa: '',
        required_skills: '', deadline: '', package: '',
    })

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

    // Filtered + sorted drives
    const filteredDrives = useMemo(() => {
        let result = [...drives]
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter((d) =>
                d.company_name?.toLowerCase().includes(q) ||
                d.role?.toLowerCase().includes(q) ||
                d.required_skills?.some((s) => s.toLowerCase().includes(q))
            )
        }
        switch (sortBy) {
            case 'newest': return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            case 'oldest': return result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
            case 'package': return result.sort((a, b) => (b.package || 0) - (a.package || 0))
            case 'cgpa': return result.sort((a, b) => (a.eligibility_cgpa || 0) - (b.eligibility_cgpa || 0))
            default: return result
        }
    }, [drives, searchQuery, sortBy])

    if (loading) return <SpinnerPage label="Loading drives..." />

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* ── Page Header ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="page-header-gradient"
            >
                <div className="absolute top-0 right-0 w-52 h-52 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                <div className="absolute bottom-0 left-1/4 w-36 h-36 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', transform: 'translateY(40%)' }} />

                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <span className="px-3 py-0.5 rounded-full text-xs font-bold text-blue-300 bg-blue-500/15 border border-blue-500/25">
                            PLACEMENT PORTAL
                        </span>
                        <h1 className="text-3xl font-black text-white mt-2">🏢 Placement Drives</h1>
                        <p className="text-blue-200/70 mt-1 text-sm">
                            {drives.length} drive{drives.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                    {isAdmin && (
                        <Button
                            variant="glow"
                            onClick={() => setShowCreate(true)}
                            leftIcon={<span>+</span>}
                        >
                            Create Drive
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* ── Search + Sort Bar ────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            >
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search by company, role, or skill..."
                        className="search-input w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <AnimatePresence>
                        {searchQuery && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sub hover:text-heading transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sort pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`filter-pill ${sortBy === opt.value ? 'active' : ''}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Result count */}
                {searchQuery && (
                    <span className="text-xs text-sub whitespace-nowrap">
                        {filteredDrives.length} result{filteredDrives.length !== 1 ? 's' : ''}
                    </span>
                )}
            </motion.div>

            {/* ── Drive Cards Grid ────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {filteredDrives.length > 0 ? (
                    <motion.div
                        key="grid"
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredDrives.map((drive, idx) => {
                            const colorSet = COMPANY_COLORS[idx % COMPANY_COLORS.length]
                            const countdown = getCountdown(drive.deadline)
                            const isUrgent = countdown && countdown.includes('h left') && !countdown.includes('d')

                            return (
                                <motion.div
                                    key={drive.id}
                                    variants={cardVariant}
                                    className="drive-card group"
                                >
                                    {/* Company logo + header */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg relative"
                                            style={{
                                                background: `linear-gradient(135deg, ${colorSet.from}, ${colorSet.to})`,
                                                boxShadow: `0 4px 16px ${colorSet.from}50`,
                                            }}
                                        >
                                            <span className="text-white font-black text-lg">
                                                {drive.company_name?.charAt(0)?.toUpperCase()}
                                            </span>
                                            <div className="absolute inset-0 rounded-2xl blur-md opacity-50 -z-10"
                                                style={{ background: `linear-gradient(135deg, ${colorSet.from}, ${colorSet.to})`, transform: 'translateY(4px) scale(0.9)' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-heading truncate">{drive.company_name}</h3>
                                            <p className="text-sm text-sub truncate">{drive.role}</p>
                                        </div>
                                        {drive.package > 0 && (
                                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-400 flex-shrink-0"
                                                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                ₹{drive.package} LPA
                                            </span>
                                        )}
                                    </div>

                                    {/* Info row */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-sub flex items-center gap-1.5">
                                                <span className="text-xs">🎓</span> Min CGPA
                                            </span>
                                            <span className="font-semibold text-body">{drive.eligibility_cgpa}</span>
                                        </div>
                                        {countdown && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-sub flex items-center gap-1.5">
                                                    <span className="text-xs">⏰</span> Deadline
                                                </span>
                                                <span className={`font-semibold text-xs px-2 py-0.5 rounded-lg ${isUrgent
                                                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                                                    : 'text-sub'
                                                    }`}>
                                                    {countdown}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skill Tags */}
                                    {drive.required_skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {drive.required_skills.slice(0, 5).map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 rounded-lg text-xs font-medium"
                                                    style={{
                                                        background: `${colorSet.from}18`,
                                                        color: colorSet.from,
                                                        border: `1px solid ${colorSet.from}30`,
                                                    }}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {drive.required_skills.length > 5 && (
                                                <span className="px-2 py-0.5 rounded-lg text-xs text-sub"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    +{drive.required_skills.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* JD Download */}
                                    {drive.jd_url && (
                                        <div className="mb-4">
                                            <a href={drive.jd_url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                                📄 View Job Description →
                                            </a>
                                        </div>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                                        {isAdmin ? (
                                            <>
                                                <Link to={`/admin/shortlist/${drive.id}`} className="btn-primary text-xs flex-1 text-center">
                                                    ⚡ Shortlist
                                                </Link>
                                                <button onClick={() => handleExport(drive.id)} className="btn-secondary text-xs">
                                                    📥 Export
                                                </button>
                                                <label className="btn-secondary text-xs cursor-pointer">
                                                    {uploadingJd === drive.id ? '⏳ Uploading...' : '📄 JD'}
                                                    <input type="file" accept=".pdf,.docx" className="hidden"
                                                        onChange={(e) => handleJdUpload(drive.id, e.target.files[0])} />
                                                </label>
                                                <Link to={`/admin/drives/${drive.id}/workflow`} className="btn-secondary text-xs">
                                                    🔄 Workflow
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                <Link to={`/drives/${drive.id}/apply`}
                                                    className="btn-primary text-xs flex-1 text-center group-hover:shadow-lg">
                                                    Apply Now →
                                                </Link>
                                                <Link to={`/experiences/${drive.id}`} className="btn-secondary text-xs">
                                                    💡 Prep
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                ) : (
                    <motion.div key="empty" className="card">
                        <EmptyState
                            variant="drives"
                            title={searchQuery ? `No drives match "${searchQuery}"` : undefined}
                            description={searchQuery ? 'Try a different search term or clear the filter.' : undefined}
                            action={
                                searchQuery ? (
                                    <button onClick={() => setSearchQuery('')} className="btn-secondary text-sm">
                                        Clear Search
                                    </button>
                                ) : isAdmin ? (
                                    <Button variant="primary" onClick={() => setShowCreate(true)}>
                                        + Create First Drive
                                    </Button>
                                ) : null
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create Drive Modal ───────────────────────────────── */}
            <Modal
                isOpen={showCreate}
                onClose={() => { setShowCreate(false); setCreateError('') }}
                title="✨ Create New Drive"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setShowCreate(false); setCreateError('') }}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            loading={createLoading}
                            onClick={handleCreateDrive}
                            type="submit"
                            form="create-drive-form"
                        >
                            Create Drive
                        </Button>
                    </>
                }
            >
                {createError && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4"
                    >
                        {createError}
                    </motion.div>
                )}
                <form id="create-drive-form" onSubmit={handleCreateDrive} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Company Name"
                            placeholder="e.g. Google"
                            value={newDrive.company_name}
                            onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                            required
                        />
                        <Input
                            label="Job Role"
                            placeholder="e.g. SDE Intern"
                            value={newDrive.role}
                            onChange={(e) => setNewDrive({ ...newDrive, role: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="Minimum CGPA"
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="e.g. 7.0"
                            value={newDrive.eligibility_cgpa}
                            onChange={(e) => setNewDrive({ ...newDrive, eligibility_cgpa: e.target.value })}
                        />
                        <Input
                            label="Package (LPA)"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g. 12.0"
                            value={newDrive.package}
                            onChange={(e) => setNewDrive({ ...newDrive, package: e.target.value })}
                        />
                        <Input
                            label="Deadline"
                            type="datetime-local"
                            value={newDrive.deadline}
                            onChange={(e) => setNewDrive({ ...newDrive, deadline: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Required Skills"
                        placeholder="e.g. Python, React, SQL, Git"
                        hint="Comma-separated"
                        value={newDrive.required_skills}
                        onChange={(e) => setNewDrive({ ...newDrive, required_skills: e.target.value })}
                    />
                </form>
            </Modal>
        </div>
    )
}

export default DriveList
