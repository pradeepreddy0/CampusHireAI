// ============================================================
// DriveWorkflow.jsx — Per-drive stage pipeline manager
// Admin-only at /admin/drives/:driveId/workflow
// Predefined defaults: Shortlisted → Exam → Interview → Offered
// Admin can add custom stages any time.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'

const STAGE_STATUS_STYLE = {
    Pending: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    Cleared: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    Eliminated: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

function DriveWorkflow() {
    const { driveId } = useParams()
    const navigate = useNavigate()

    const [drive, setDrive] = useState(null)
    const [stages, setStages] = useState([])
    const [activeStage, setActiveStage] = useState(null)
    const [progress, setProgress] = useState([])  // students in active stage
    const [edits, setEdits] = useState({})  // { [application_id]: status }
    const [loadingDrive, setLoadingDrive] = useState(true)
    const [loadingProgress, setLoadingProgress] = useState(false)

    // Add stage form
    const [addingStage, setAddingStage] = useState(false)
    const [newStageName, setNewStageName] = useState('')
    const [savingStages, setSavingStages] = useState(false)
    const [savingProgress, setSavingProgress] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    // Load drive info + stages
    const loadDrive = useCallback(async () => {
        setLoadingDrive(true)
        try {
            const [driveRes, stagesRes] = await Promise.all([
                api.get(`/drives/${driveId}`),
                api.get(`/drives/${driveId}/stages`),
            ])
            setDrive(driveRes.data)
            setStages(stagesRes.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingDrive(false)
        }
    }, [driveId])

    useEffect(() => { loadDrive() }, [loadDrive])

    // When a stage is clicked, load its student progress
    const selectStage = async (stage) => {
        setActiveStage(stage)
        setEdits({})
        setLoadingProgress(true)
        try {
            const res = await api.get(`/stages/${stage.id}/progress`)
            setProgress(res.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingProgress(false)
        }
    }

    // Seed defaults if no stages yet
    const initDefaults = async () => {
        setSavingStages(true)
        try {
            await api.post(`/drives/${driveId}/stages`, { init_defaults: true })
            await loadDrive()
            showToast('Default stages created')
        } catch (e) {
            showToast('Failed to create defaults', 'error')
        } finally {
            setSavingStages(false)
        }
    }

    // Add custom stage
    const addStage = async () => {
        if (!newStageName.trim()) return
        setSavingStages(true)
        const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.stage_order)) + 1 : 1
        try {
            await api.post(`/drives/${driveId}/stages`, {
                name: newStageName.trim(),
                stage_order: nextOrder,
            })
            setNewStageName('')
            setAddingStage(false)
            await loadDrive()
            showToast(`Stage "${newStageName.trim()}" added`)
        } catch (e) {
            showToast('Failed to add stage', 'error')
        } finally {
            setSavingStages(false)
        }
    }

    // Delete a stage
    const deleteStage = async (stageId) => {
        if (!confirm('Delete this stage? Student progress for this stage will also be removed.')) return
        try {
            await api.delete(`/drives/${driveId}/stages/${stageId}`)
            if (activeStage?.id === stageId) { setActiveStage(null); setProgress([]) }
            await loadDrive()
            showToast('Stage deleted')
        } catch (e) {
            showToast('Failed to delete stage', 'error')
        }
    }

    // Track local status edits
    const setStudentStatus = (appId, status) => {
        setEdits(prev => ({ ...prev, [appId]: status }))
    }

    // Save all edits + send emails
    const saveProgress = async () => {
        const updates = Object.entries(edits).map(([application_id, status]) => ({
            application_id: parseInt(application_id),
            status,
        }))
        if (updates.length === 0) { showToast('No changes to save', 'error'); return }
        setSavingProgress(true)
        try {
            const res = await api.post(`/stages/${activeStage.id}/progress`, { updates })
            showToast(`Saved ${res.data.updated} updates, ${res.data.emails_sent} emails sent`)
            setEdits({})
            // Refresh progress
            const fresh = await api.get(`/stages/${activeStage.id}/progress`)
            setProgress(fresh.data)
        } catch (e) {
            showToast('Save failed', 'error')
        } finally {
            setSavingProgress(false)
        }
    }

    if (loadingDrive) {
        return <div className="card text-center py-16 text-sub">Loading workflow…</div>
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                            }`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Drive Info Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <button onClick={() => navigate('/admin/drive-history')} className="text-sub text-sm mb-3 hover:text-heading flex items-center gap-1">
                    ← Back to Drive History
                </button>
                <div className="card">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-heading">{drive?.company_name}</h1>
                            <p className="text-sub mt-1">{drive?.role}</p>
                        </div>
                        <div className="flex gap-6 text-sm text-sub">
                            {drive?.package > 0 && <span>💰 {drive.package} LPA</span>}
                            {drive?.eligibility_cgpa > 0 && <span>📊 Min CGPA: {drive.eligibility_cgpa}</span>}
                            {drive?.deadline && <span>📅 {new Date(drive.deadline).toLocaleDateString()}</span>}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stage Pipeline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-heading">🔄 Selection Stages</h2>
                    <div className="flex gap-2">
                        {stages.length === 0 && (
                            <button
                                onClick={initDefaults}
                                disabled={savingStages}
                                className="btn-primary text-xs"
                            >
                                {savingStages ? 'Setting up…' : '+ Use Defaults'}
                            </button>
                        )}
                        <button
                            onClick={() => setAddingStage(v => !v)}
                            className="btn-secondary text-xs"
                        >
                            + Add Stage
                        </button>
                    </div>
                </div>

                {/* Add stage form */}
                <AnimatePresence>
                    {addingStage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="flex gap-3 mb-4 overflow-hidden"
                        >
                            <input
                                className="input flex-1 text-sm"
                                placeholder="Stage name (e.g. GD, HR Round, Online Test)"
                                value={newStageName}
                                onChange={e => setNewStageName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addStage()}
                            />
                            <button onClick={addStage} disabled={savingStages} className="btn-primary text-sm">
                                {savingStages ? 'Adding…' : 'Add'}
                            </button>
                            <button onClick={() => setAddingStage(false)} className="btn-secondary text-sm">Cancel</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pipeline visual */}
                {stages.length === 0 ? (
                    <p className="text-sub text-sm text-center py-6">
                        No stages yet. Click <strong>"Use Defaults"</strong> to create Shortlisted → Exam → Interview → Offered, or add custom stages.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2 items-center">
                        {stages.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => selectStage(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activeStage?.id === s.id
                                        ? 'bg-primary-500 text-white border-primary-500'
                                        : 'bg-white/5 text-sub border-white/10 hover:border-white/25 hover:text-heading'
                                        }`}
                                >
                                    {s.stage_order}. {s.name}
                                </button>
                                <button
                                    onClick={() => deleteStage(s.id)}
                                    className="text-red-400/50 hover:text-red-400 text-xs transition-colors"
                                    title="Delete stage"
                                >✕</button>
                                {i < stages.length - 1 && <span className="text-sub">→</span>}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Stage Progress Panel */}
            <AnimatePresence>
                {activeStage && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="card"
                    >
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <h2 className="text-base font-semibold text-heading">
                                📋 Stage: <span className="text-primary-400">{activeStage.name}</span>
                            </h2>
                            <button
                                onClick={saveProgress}
                                disabled={savingProgress || Object.keys(edits).length === 0}
                                className="btn-primary text-sm"
                            >
                                {savingProgress
                                    ? 'Saving…'
                                    : `💾 Save & Notify (${Object.keys(edits).length} change${Object.keys(edits).length !== 1 ? 's' : ''})`}
                            </button>
                        </div>

                        {loadingProgress ? (
                            <div className="text-center text-sub py-10">Loading students…</div>
                        ) : progress.length === 0 ? (
                            <div className="text-center text-sub py-10">
                                No shortlisted students found for this drive yet.
                                <br />Run shortlisting first from the Shortlist Results page.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5 text-sub">
                                            <th className="text-left px-4 py-3 font-medium">Name</th>
                                            <th className="text-left px-4 py-3 font-medium">Roll No</th>
                                            <th className="text-left px-4 py-3 font-medium">Branch</th>
                                            <th className="text-right px-4 py-3 font-medium">CGPA</th>
                                            <th className="text-right px-4 py-3 font-medium">AI Score</th>
                                            <th className="text-center px-4 py-3 font-medium">Stage Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {progress.map(p => {
                                            const current = edits[p.application_id] ?? p.stage_status
                                            const changed = edits[p.application_id] !== undefined
                                            return (
                                                <tr
                                                    key={p.application_id}
                                                    className={`border-b border-white/5 transition-colors ${changed ? 'bg-amber-500/5' : 'hover:bg-white/3'}`}
                                                >
                                                    <td className="px-4 py-3 font-semibold text-heading">{p.name}</td>
                                                    <td className="px-4 py-3 text-sub">{p.roll_no}</td>
                                                    <td className="px-4 py-3 text-sub">{p.branch}</td>
                                                    <td className="px-4 py-3 text-right text-sub">{p.cgpa}</td>
                                                    <td className="px-4 py-3 text-right text-primary-400 font-semibold">
                                                        {p.ai_score != null ? p.ai_score.toFixed(3) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <select
                                                            value={current}
                                                            onChange={e => setStudentStatus(p.application_id, e.target.value)}
                                                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium bg-transparent cursor-pointer focus:outline-none ${STAGE_STATUS_STYLE[current]}`}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Cleared">Cleared ✅</option>
                                                            <option value="Eliminated">Eliminated ❌</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                <p className="text-xs text-sub mt-3 px-4">
                                    💡 Emails are sent automatically to students when you save Cleared or Eliminated statuses.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DriveWorkflow
