// ============================================================
// Login.jsx — Centered Split-Card Authentication Page
// ============================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [shake, setShake] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        setShake(false)
        try {
            const res = await api.post('/login', { email, password })
            setSuccess(true)
            setTimeout(() => {
                login(res.data)
                navigate('/')
            }, 800)
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed')
            setShake(true)
            setTimeout(() => setShake(false), 600)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background orbs */}
            <div className="orb orb-blue"></div>
            <div className="orb orb-purple"></div>

            {/* Split Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`w-full max-w-4xl relative z-10 rounded-3xl overflow-hidden flex shadow-2xl shadow-black/30 border border-dark-700/50 ${shake ? 'animate-shake' : ''}`}
                style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(20px)' }}
            >
                {/* Left — Form Side */}
                <div className="flex-1 p-8 sm:p-10">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4 shadow-lg shadow-primary-500/20">
                            <span className="text-white font-bold text-lg">CH</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                        <p className="text-dark-400 mt-1 text-sm">Sign in to your CampusHireAI account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
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
                                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Login successful! Redirecting...
                            </motion.div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
                            <input id="email" type="email" className="input" placeholder="you@university.edu"
                                value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input id="password" type={showPassword ? 'text' : 'password'} className="input !pr-10"
                                    placeholder="Enter your password" value={password}
                                    onChange={(e) => setPassword(e.target.value)} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                                    <motion.div initial={false} animate={{ rotateY: showPassword ? 180 : 0 }} transition={{ duration: 0.3 }}>
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
                                    </motion.div>
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full !py-3" disabled={loading || success}>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : success ? 'Welcome!' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-dark-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Create account</Link>
                    </p>
                </div>

                {/* Right — Illustration Panel */}
                <div className="hidden md:flex w-[45%] auth-illustration-panel items-center justify-center p-8 flex-shrink-0">
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
                            <svg viewBox="0 0 400 300" className="w-full max-w-[240px] mx-auto" fill="none">
                                <rect x="80" y="120" width="240" height="140" rx="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                <rect x="100" y="80" width="200" height="50" rx="6" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                                <rect x="120" y="130" width="8" height="120" fill="rgba(255,255,255,0.2)" />
                                <rect x="170" y="130" width="8" height="120" fill="rgba(255,255,255,0.2)" />
                                <rect x="222" y="130" width="8" height="120" fill="rgba(255,255,255,0.2)" />
                                <rect x="272" y="130" width="8" height="120" fill="rgba(255,255,255,0.2)" />
                                <rect x="175" y="190" width="50" height="70" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                                <polygon points="70,128 200,40 330,128" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                                <circle cx="320" cy="70" r="4" fill="rgba(255,255,255,0.6)"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" /></circle>
                                <circle cx="340" cy="90" r="3" fill="rgba(255,255,255,0.4)"><animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" /></circle>
                                <circle cx="60" cy="100" r="3" fill="rgba(255,255,255,0.5)"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" /></circle>
                                <polygon points="190,50 210,50 200,38" fill="rgba(255,255,255,0.5)" />
                                <rect x="185" y="50" width="30" height="4" fill="rgba(255,255,255,0.4)" />
                            </svg>
                        </motion.div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Campus<span className="text-white/80">HireAI</span>
                        </h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            AI-powered placement platform for smarter campus recruitment
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}

export default Login
