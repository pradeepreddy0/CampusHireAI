// ============================================================
// Signup.jsx — Centered Split-Card Registration Page
// ============================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Signup() {
    const [form, setForm] = useState({
        roll_no: '', name: '', email: '', password: '',
        branch: '', cgpa: '', cgpa_10th: '', percentage_12th: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [shake, setShake] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        setShake(false)
        try {
            const payload = {
                ...form,
                role: 'student',
                cgpa: form.cgpa ? parseFloat(form.cgpa) : 0,
                cgpa_10th: form.cgpa_10th ? parseFloat(form.cgpa_10th) : 0,
                percentage_12th: form.percentage_12th ? parseFloat(form.percentage_12th) : 0,
            }
            const res = await api.post('/signup', payload)
            setSuccess(true)
            setTimeout(() => {
                login(res.data)
                navigate('/')
            }, 800)
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Please try again.')
            setShake(true)
            setTimeout(() => setShake(false), 600)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
            {/* Background orbs */}
            <div className="orb orb-blue"></div>
            <div className="orb orb-purple"></div>

            {/* Split Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`w-full max-w-5xl relative z-10 rounded-3xl overflow-hidden flex shadow-2xl shadow-black/30 border border-dark-700/50 ${shake ? 'animate-shake' : ''}`}
                style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(20px)' }}
            >
                {/* Left — Illustration Panel */}
                <div className="hidden md:flex w-[38%] auth-illustration-panel items-center justify-center p-8 flex-shrink-0">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="mb-6"
                        >
                            <svg viewBox="0 0 400 300" className="w-full max-w-[220px] mx-auto" fill="none">
                                <rect x="100" y="60" width="200" height="200" rx="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                                <circle cx="200" cy="120" r="35" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                <circle cx="200" cy="110" r="14" fill="rgba(255,255,255,0.25)" />
                                <path d="M178 135 c0 -12 10 -22 22 -22 s 22 10 22 22" fill="rgba(255,255,255,0.2)" />
                                <rect x="140" y="175" width="120" height="8" rx="4" fill="rgba(255,255,255,0.15)" />
                                <rect x="140" y="195" width="90" height="8" rx="4" fill="rgba(255,255,255,0.12)" />
                                <rect x="140" y="215" width="100" height="8" rx="4" fill="rgba(255,255,255,0.1)" />
                                <circle cx="320" cy="80" r="4" fill="rgba(255,255,255,0.6)"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" /></circle>
                                <circle cx="80" cy="200" r="3" fill="rgba(255,255,255,0.5)"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" /></circle>
                                <circle cx="340" cy="220" r="3" fill="rgba(255,255,255,0.4)"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" /></circle>
                                <circle cx="270" cy="90" r="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <line x1="270" y1="84" x2="270" y2="96" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                                <line x1="264" y1="90" x2="276" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </motion.div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Join Campus<span className="text-white/80">HireAI</span>
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Create your profile and explore placement opportunities
                        </p>
                    </motion.div>
                </div>

                {/* Right — Form Side */}
                <div className="flex-1 p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-5">
                        <div className="md:hidden inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-3 shadow-lg shadow-primary-500/20">
                            <span className="text-white font-bold text-lg">CH</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">Create your account</h1>
                        <p className="text-dark-400 mt-1 text-sm">Student registration for CampusHireAI</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Account created! Redirecting...
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label htmlFor="roll_no" className="label">Roll Number</label>
                                <input id="roll_no" type="text" className="input" placeholder="e.g. 21CS001"
                                    value={form.roll_no} onChange={(e) => updateField('roll_no', e.target.value)} required />
                            </div>
                            <div>
                                <label htmlFor="name" className="label">Full Name</label>
                                <input id="name" type="text" className="input" placeholder="John Doe"
                                    value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="label">Email Address</label>
                            <input id="email" type="email" className="input" placeholder="you@university.edu"
                                value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <div className="relative">
                                <input id="password" type={showPassword ? 'text' : 'password'} className="input !pr-10"
                                    placeholder="Min. 6 characters"
                                    value={form.password} onChange={(e) => updateField('password', e.target.value)} required minLength={6} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                                    {showPassword ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label htmlFor="branch" className="label">Branch</label>
                                <select id="branch" className="input" value={form.branch} onChange={(e) => updateField('branch', e.target.value)}>
                                    <option value="">Select Branch</option>
                                    <option value="CSE">CSE</option>
                                    <option value="CSM">CSM</option>
                                    <option value="IT">IT</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="ME">ME</option>
                                    <option value="CE">CE</option>
                                    <option value="AIDS">AI & DS</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="cgpa" className="label">CGPA (out of 10)</label>
                                <input id="cgpa" type="number" step="0.01" min="0" max="10" className="input"
                                    placeholder="e.g. 8.50" value={form.cgpa} onChange={(e) => updateField('cgpa', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label htmlFor="cgpa_10th" className="label">10th CGPA (out of 10)</label>
                                <input id="cgpa_10th" type="number" step="0.01" min="0" max="10" className="input"
                                    placeholder="e.g. 9.20" value={form.cgpa_10th} onChange={(e) => updateField('cgpa_10th', e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="percentage_12th" className="label">12th Percentage (%)</label>
                                <input id="percentage_12th" type="number" step="0.01" min="0" max="100" className="input"
                                    placeholder="e.g. 92.50" value={form.percentage_12th} onChange={(e) => updateField('percentage_12th', e.target.value)} />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full !py-2.5" disabled={loading || success}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : success ? 'Welcome!' : 'Create Student Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-dark-400 mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default Signup
