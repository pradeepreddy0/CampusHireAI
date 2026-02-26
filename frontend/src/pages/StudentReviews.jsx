// ============================================================
// StudentReviews.jsx — Placed students can review companies
// ============================================================

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function StudentReviews() {
    const { user, isAdmin } = useAuth()
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [canReview, setCanReview] = useState(false)
    const [offers, setOffers] = useState([])
    const [form, setForm] = useState({ company: '', rating: 5, content: '', drive_id: '' })

    useEffect(() => {
        fetchReviews()
        if (!isAdmin) checkEligibility()
    }, [])

    const fetchReviews = async () => {
        try { const res = await api.get('/reviews'); setReviews(res.data || []) }
        catch (err) { console.error('Failed to fetch reviews:', err) }
        finally { setLoading(false) }
    }

    const checkEligibility = async () => {
        try {
            const res = await api.get('/offers/my')
            if (res.data?.length > 0) {
                setCanReview(true)
                setOffers(res.data)
            }
        } catch { /* not placed */ }
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('')
        try {
            await api.post('/reviews', {
                company: form.company,
                rating: parseInt(form.rating),
                content: form.content,
                drive_id: form.drive_id ? parseInt(form.drive_id) : null,
            })
            setForm({ company: '', rating: 5, content: '', drive_id: '' })
            setShowForm(false)
            fetchReviews()
        } catch (err) { setError(err.response?.data?.detail || 'Failed to submit review') }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this review?')) return
        try { await api.delete(`/reviews/${id}`); fetchReviews() }
        catch { alert('Delete failed') }
    }

    const renderStars = (rating) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl text-heading">⭐ Company Reviews</h1>
                    <p className="text-sub mt-1">Reviews from placed students about their company experience</p>
                </div>
                {canReview && !isAdmin && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Write Review</button>
                )}
            </div>

            {/* Review Form (placed students only) */}
            {showForm && canReview && (
                <div className="card mb-8 animate-slide-up">
                    <h2 className="text-lg font-semibold text-heading mb-4">✍️ Write a Review</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Company Name</label>
                                <select className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required>
                                    <option value="">Select company</option>
                                    {[...new Set(offers.map((o) => o.company))].map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Rating</label>
                                <div className="flex items-center space-x-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button key={n} type="button"
                                            onClick={() => setForm({ ...form, rating: n })}
                                            className={`text-2xl transition-all ${n <= form.rating ? 'text-amber-400' : 'text-current/20'}`}>
                                            ★
                                        </button>
                                    ))}
                                    <span className="text-sm text-sub ml-2">{form.rating}/5</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="label">Your Review</label>
                            <textarea className="input min-h-[120px]"
                                placeholder="Share your experience — interview process, work culture, tips for future students..."
                                value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                        </div>

                        <div className="flex space-x-3">
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Submitting...' : 'Submit Review'}
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-4 stagger">
                    {reviews.map((review) => (
                        <div key={review.id} className="card animate-fade-in">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="font-semibold text-heading">{review.company}</h3>
                                        <span className="text-amber-400 text-sm tracking-wider">{renderStars(review.rating)}</span>
                                        {review.drives && (
                                            <span className="badge-applied text-xs">
                                                {review.drives.company_name} — {review.drives.role}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-body text-sm whitespace-pre-wrap">{review.content}</p>
                                    <div className="flex items-center space-x-3 mt-3 text-xs text-sub">
                                        <span>By {review.users?.name || 'Anonymous'}</span>
                                        {review.users?.branch && <span>• {review.users.branch}</span>}
                                        <span>• {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                                {(isAdmin || review.student_id === user?.user_id) && (
                                    <button onClick={() => handleDelete(review.id)}
                                        className="ml-3 px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sub text-lg">No reviews yet</p>
                    {canReview && <p className="text-sub text-sm mt-2">Be the first to share your experience!</p>}
                </div>
            )}
        </div>
    )
}

export default StudentReviews
