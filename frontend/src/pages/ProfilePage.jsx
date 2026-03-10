// ============================================================
// ProfilePage.jsx — Student Profile View & Edit
// Lets students update their CGPA, branch, and other details
// ============================================================

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function ProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        name: '',
        email: '',
        branch: '',
        cgpa: '',
        roll_no: '',
        phone: '',
    })

    useEffect(() => {
        api.get('/me').then((res) => {
            const p = res.data
            setProfile(p)
            setForm({
                name: p.name || '',
                email: p.email || '',
                branch: p.branch || '',
                cgpa: p.cgpa || '',
                roll_no: p.roll_no || '',
                phone: p.phone || '',
            })
        }).catch((err) => {
            console.error('Failed to load profile:', err)
        }).finally(() => setLoading(false))
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            await api.put('/me', {
                name: form.name,
                branch: form.branch,
                cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
                roll_no: form.roll_no,
                phone: form.phone,
            })
            setProfile({ ...profile, ...form })
            setEditing(false)
            setSuccess('Profile updated successfully!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save profile.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
            </div>
        )
    }

    const isProfileComplete = !!(profile?.branch && profile?.cgpa)

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="page-header-gradient mb-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="relative flex items-center gap-5">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                        <span className="text-white font-black text-2xl">
                            {(profile?.name || user?.name || 'S')[0].toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25">
                            MY PROFILE
                        </span>
                        <h1 className="text-2xl font-black text-white mt-1.5">{profile?.name}</h1>
                        <p className="text-blue-200/70 text-sm">{profile?.email}</p>
                    </div>
                    <div className="ml-auto">
                        {isProfileComplete ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                                ✅ Complete
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30">
                                ⚡ Incomplete
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="card"
            >
                {/* Success / Error banners */}
                {success && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                        ✅ {success}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {!editing ? (
                    // ── View Mode ────────────────────────────────────────
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-heading">Profile Information</h2>
                            <button onClick={() => setEditing(true)} className="btn-primary text-sm">
                                ✏️ Edit Profile
                            </button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Full Name', value: profile?.name, icon: '👤' },
                                { label: 'Email', value: profile?.email, icon: '📧' },
                                { label: 'Roll Number', value: profile?.roll_no || '—', icon: '🎓' },
                                { label: 'Branch', value: profile?.branch || '—', icon: '🏛️' },
                                { label: 'CGPA', value: profile?.cgpa || '—', icon: '📊' },
                                { label: 'Phone', value: profile?.phone || '—', icon: '📱' },
                            ].map(({ label, value, icon }) => (
                                <div key={label} className="flex items-start gap-3 p-3 rounded-xl border border-current/5 bg-white/[0.02]">
                                    <span className="text-lg mt-0.5">{icon}</span>
                                    <div>
                                        <p className="text-xs font-medium text-sub">{label}</p>
                                        <p className={`text-sm font-semibold mt-0.5 ${value === '—' ? 'text-sub' : 'text-heading'}`}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!isProfileComplete && (
                            <div className="mt-6 p-4 bg-amber-500/8 border border-amber-500/25 rounded-xl">
                                <p className="text-amber-300 text-sm font-medium mb-1">⚡ Your profile is incomplete</p>
                                <p className="text-sub text-xs">
                                    Please add your <strong className="text-amber-200">Branch</strong> and <strong className="text-amber-200">CGPA</strong> to improve your shortlisting chances and unlock drive recommendations.
                                </p>
                                <button onClick={() => setEditing(true)} className="mt-3 btn-primary text-xs px-4 py-1.5">
                                    Complete Now →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    // ── Edit Mode ────────────────────────────────────────
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-heading">Edit Profile</h2>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input className="input" value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input className="input opacity-60 cursor-not-allowed" value={form.email} readOnly
                                        title="Email cannot be changed" />
                                </div>
                                <div>
                                    <label className="label">Roll Number</label>
                                    <input className="input" placeholder="e.g. 21CS001"
                                        value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Branch / Department</label>
                                    <select className="input" value={form.branch}
                                        onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                                        <option value="">— Select Branch —</option>
                                        {['CSE', 'IT', 'ECE', 'EEE', 'Mech', 'Civil', 'Chemical', 'Biotech', 'Other'].map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">CGPA (out of 10)</label>
                                    <input type="number" step="0.01" min="0" max="10" className="input"
                                        placeholder="e.g. 8.5" value={form.cgpa}
                                        onChange={(e) => setForm({ ...form, cgpa: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input className="input" placeholder="+91 9876543210"
                                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? '⏳ Saving...' : '💾 Save Changes'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setError('') }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default ProfilePage
