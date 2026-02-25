// ============================================================
// Signup.jsx — Registration Page
//
// Collects: roll_no, name, email, password, role, branch, cgpa.
// On success: stores JWT via AuthContext and redirects to home.
// ============================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Signup() {
    const [form, setForm] = useState({
        roll_no: '',
        name: '',
        email: '',
        password: '',
        role: 'student',
        branch: '',
        cgpa: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    // Update form field
    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Build payload — convert cgpa to float
            const payload = {
                ...form,
                cgpa: form.cgpa ? parseFloat(form.cgpa) : 0,
            }

            // POST /api/signup → returns { access_token, role, user_id, name }
            const res = await api.post('/signup', payload)
            login(res.data)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4 py-8">
            <div className="w-full max-w-lg animate-fade-in">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
                        <span className="text-white font-bold text-xl">CH</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        Campus<span className="text-primary-600">HireAI</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Create your account</p>
                </div>

                {/* Form Card */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Row: Roll No + Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="roll_no" className="label">Roll Number</label>
                                <input
                                    id="roll_no"
                                    type="text"
                                    className="input"
                                    placeholder="e.g. 21CS001"
                                    value={form.roll_no}
                                    onChange={(e) => updateField('roll_no', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="name" className="label">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    className="input"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="label">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="you@university.edu"
                                value={form.email}
                                onChange={(e) => updateField('email', e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={(e) => updateField('password', e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {/* Row: Role + Branch */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="role" className="label">Role</label>
                                <select
                                    id="role"
                                    className="input"
                                    value={form.role}
                                    onChange={(e) => updateField('role', e.target.value)}
                                >
                                    <option value="student">Student</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="branch" className="label">Branch</label>
                                <select
                                    id="branch"
                                    className="input"
                                    value={form.branch}
                                    onChange={(e) => updateField('branch', e.target.value)}
                                >
                                    <option value="">Select Branch</option>
                                    <option value="CSE">CSE</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="ME">ME</option>
                                    <option value="CE">CE</option>
                                    <option value="IT">IT</option>
                                    <option value="AIDS">AI & DS</option>
                                </select>
                            </div>
                        </div>

                        {/* CGPA — only for students */}
                        {form.role === 'student' && (
                            <div>
                                <label htmlFor="cgpa" className="label">CGPA (out of 10)</label>
                                <input
                                    id="cgpa"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    className="input"
                                    placeholder="e.g. 8.50"
                                    value={form.cgpa}
                                    onChange={(e) => updateField('cgpa', e.target.value)}
                                />
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Signup
